import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentPublicService {
  constructor(private prisma: PrismaService) {}

  async getFormByToken(token: string) {
    const link = await this.prisma.assessmentLink.findUnique({
      where: { token },
      include: {
        assessment: {
          include: {
            assessment_questions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    compartment: { select: { id: true, name: true, order: true } },
                    applicable_providers: true,
                  },
                },
              },
            },
          },
        },
        customer: { select: { name: true, email: true } },
        insurance_provider: { select: { id: true, name: true } },
      },
    });

    if (!link) throw new NotFoundException('Invalid or expired assessment link');

    // Filter questions applicable to the linked insurance provider (or CONSOLIDATION = all questions)
    const allQuestions = link.assessment.assessment_questions.map((aq) => aq.question);
    const isConsolidation = link.insurance_provider.name.toLowerCase() === 'consolidation';

    const filteredQuestions = isConsolidation
      ? allQuestions
      : allQuestions.filter((q) =>
          q.applicable_providers.some((p) => p.insurance_provider_id === link.insurance_provider_id),
        );

    // Group by compartment, sorted by compartment order
    const compartmentMap = new Map<string, any>();
    for (const q of filteredQuestions) {
      const cId = q.compartment.id;
      if (!compartmentMap.has(cId)) {
        compartmentMap.set(cId, {
          id: cId,
          name: q.compartment.name,
          order: q.compartment.order,
          questions: [],
        });
      }
      compartmentMap.get(cId).questions.push({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        risk_weight: q.risk_weight,
      });
    }

    const compartments = Array.from(compartmentMap.values()).sort((a, b) => a.order - b.order);

    // Mark as IN_PROGRESS if YET_TO_START
    if (link.status === 'YET_TO_START') {
      await this.prisma.assessmentLink.update({
        where: { id: link.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Load existing draft answers if any
    const existingResponse = await this.prisma.response.findUnique({
      where: { assessment_link_id: link.id },
      include: { answers: true },
    });

    return {
      data: {
        assessment_name: link.assessment.name,
        customer_name: link.customer.name,
        insurance_provider_name: link.insurance_provider.name,
        compartments,
        total_questions: filteredQuestions.length,
        draft_answers: existingResponse
          ? existingResponse.answers.map((a) => ({
              question_id: a.question_id,
              answer: JSON.parse(a.answer),
            }))
          : [],
        status: link.status === 'SUBMITTED' ? 'SUBMITTED' : 'IN_PROGRESS',
        is_submitted: link.status === 'SUBMITTED',
        progress_percent: link.progress_percent,
      },
    };
  }

  async saveDraft(token: string, answers: { question_id: string; answer: any }[], filledBy: 'USER' | 'AGENT' = 'USER') {
    const link = await this.prisma.assessmentLink.findUnique({ where: { token } });
    if (!link) throw new NotFoundException('Invalid assessment link');
    if (link.status === 'SUBMITTED') throw new ForbiddenException('Assessment already submitted');

    // Calculate progress
    const totalQuestions = await this.prisma.assessmentQuestion.count({
      where: { assessment_id: link.assessment_id },
    });
    const answeredCount = answers.filter((a) => a.answer !== null && a.answer !== '' && a.answer !== undefined).length;
    const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    // Upsert response
    let response = await this.prisma.response.findUnique({
      where: { assessment_link_id: link.id },
    });

    if (!response) {
      response = await this.prisma.response.create({
        data: { assessment_link_id: link.id, filled_by: filledBy },
      });
    } else {
      await this.prisma.response.update({
        where: { id: response.id },
        data: { filled_by: filledBy },
      });
    }

    // Upsert answers
    for (const ans of answers) {
      await this.prisma.responseAnswer.upsert({
        where: {
          response_id_question_id: { response_id: response.id, question_id: ans.question_id },
        },
        create: {
          response_id: response.id,
          question_id: ans.question_id,
          answer: JSON.stringify(ans.answer),
        },
        update: {
          answer: JSON.stringify(ans.answer),
        },
      });
    }

    // Update progress
    await this.prisma.assessmentLink.update({
      where: { id: link.id },
      data: { status: 'IN_PROGRESS', progress_percent: progress },
    });

    return { message: 'Draft saved successfully', progress_percent: progress };
  }

  async submit(
    token: string,
    answers: { question_id: string; answer: any }[],
    filledBy: 'USER' | 'AGENT',
    consentConfirmed: boolean,
    ip?: string,
    userAgent?: string,
  ) {
    const link = await this.prisma.assessmentLink.findUnique({ where: { token } });
    if (!link) throw new NotFoundException('Invalid assessment link');
    if (link.status === 'SUBMITTED') throw new ForbiddenException('Assessment already submitted');
    if (!consentConfirmed) throw new BadRequestException('Consent must be confirmed before submission');

    // Create or update response
    let response = await this.prisma.response.findUnique({
      where: { assessment_link_id: link.id },
    });

    if (response) {
      await this.prisma.responseAnswer.deleteMany({ where: { response_id: response.id } });
      await this.prisma.response.update({
        where: { id: response.id },
        data: {
          filled_by: filledBy, submitted_by: filledBy,
          consent_confirmed: consentConfirmed, is_submitted: true,
          submitted_at: new Date(),
          ip_address: ip || null, user_agent: userAgent || null,
        },
      });
    } else {
      response = await this.prisma.response.create({
        data: {
          assessment_link_id: link.id,
          filled_by: filledBy, submitted_by: filledBy,
          consent_confirmed: consentConfirmed, is_submitted: true,
          submitted_at: new Date(),
          ip_address: ip || null, user_agent: userAgent || null,
        },
      });
    }

    // Create answers
    await this.prisma.responseAnswer.createMany({
      data: answers.map((a) => ({
        response_id: response!.id,
        question_id: a.question_id,
        answer: JSON.stringify(a.answer),
      })),
    });

    // Lock the link — IMMUTABLE after this
    await this.prisma.assessmentLink.update({
      where: { id: link.id },
      data: { status: 'SUBMITTED', progress_percent: 100, submitted_at: new Date() },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'SUBMIT_ASSESSMENT',
        entity_type: 'RESPONSE',
        entity_id: response.id,
        performed_by: filledBy === 'AGENT' ? (link.agent_id || 'agent') : 'customer',
        performer_role: filledBy === 'AGENT' ? 'AGENT' : 'USER',
        details: JSON.stringify({ token, filled_by: filledBy }),
        ip_address: ip || null,
        user_agent: userAgent || null,
      },
    });

    return { message: 'Assessment submitted successfully. Responses are now locked and immutable.' };
  }
}

import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async getDashboardStats(agentId: string) {
    const [assigned_customers, total_assessments, yet_to_start, in_progress, submitted, total_links] = await Promise.all([
      this.prisma.customer.count({ where: { agent_id: agentId } }),
      this.prisma.assessmentLink.count({ where: { agent_id: agentId } }),
      this.prisma.assessmentLink.count({ where: { agent_id: agentId, status: 'YET_TO_START' } }),
      this.prisma.assessmentLink.count({ where: { agent_id: agentId, status: 'IN_PROGRESS' } }),
      this.prisma.assessmentLink.count({ where: { agent_id: agentId, status: 'SUBMITTED' } }),
      this.prisma.assessmentLink.count({ where: { agent_id: agentId } }),
    ]);

    const [yetToStartUsers, inProgressUsers, submittedUsers] = await Promise.all([
      this.prisma.assessmentLink.findMany({
        where: { agent_id: agentId, status: 'YET_TO_START' },
        include: { customer: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.assessmentLink.findMany({
        where: { agent_id: agentId, status: 'IN_PROGRESS' },
        include: { customer: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.assessmentLink.findMany({
        where: { agent_id: agentId, status: 'SUBMITTED' },
        include: { customer: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return {
      data: {
        assigned_customers, total_assessments, yet_to_start, in_progress, submitted, total_links,
        yet_to_start_users: yetToStartUsers.map(l => ({ id: l.customer.id, name: l.customer.name, email: l.customer.email })),
        in_progress_users: inProgressUsers.map(l => ({ id: l.customer.id, name: l.customer.name, email: l.customer.email })),
        submitted_users: submittedUsers.map(l => ({ id: l.customer.id, name: l.customer.name, email: l.customer.email })),
      },
    };
  }

  async getAssignedLinks(agentId: string) {
    const links = await this.prisma.assessmentLink.findMany({
      where: { agent_id: agentId },
      orderBy: { created_at: 'desc' },
      include: {
        assessment: { select: { name: true } },
        customer: { select: { name: true, email: true } },
        insurance_provider: { select: { name: true } },
      },
    });

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');

    return {
      data: links.map((l) => ({
        id: l.id,
        assessment_id: l.assessment_id, assessment_name: l.assessment.name,
        customer_id: l.customer_id, customer_name: l.customer.name, customer_email: l.customer.email,
        insurance_provider_id: l.insurance_provider_id, insurance_provider_name: l.insurance_provider.name,
        agent_id: l.agent_id, agent_name: null,
        token: l.token, link_url: `${frontendUrl}/assess/${l.token}`,
        status: l.status, progress_percent: l.progress_percent,
        submitted_at: l.submitted_at?.toISOString() || null,
        created_at: l.created_at.toISOString(),
      })),
      total: links.length, page: 1, limit: links.length,
    };
  }

  async getAssignedCustomers(agentId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { agent_id: agentId },
      orderBy: { created_at: 'desc' },
    });
    return {
      data: customers.map((c) => ({
        id: c.id, name: c.name, company_name: c.company_name,
        email: c.email, phone: c.phone, industry: c.industry,
        agent_id: c.agent_id, created_at: c.created_at.toISOString(),
      })),
      total: customers.length, page: 1, limit: customers.length,
    };
  }

  async createCustomer(agentId: string, data: { name: string; company_name: string; email: string; phone?: string; industry?: string }) {
    const existing = await this.prisma.customer.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Customer with this email already exists');

    const tempPassword = this.authService.generateTempPassword();
    const hashed = await this.authService.hashPassword(tempPassword);

    const customer = await this.prisma.customer.create({
      data: {
        ...data,
        agent_id: agentId,
        password: hashed,
        must_change_password: true,
      },
    });

    // Send login credentials email
    await this.mailService.sendLoginCredentials(data.email, data.name, 'Customer', tempPassword);

    return {
      data: { ...customer, created_at: customer.created_at.toISOString(), temp_password: tempPassword },
      message: 'Customer created successfully. Login credentials sent via email.',
    };
  }

  async resendLink(agentId: string, linkId: string) {
    const link = await this.prisma.assessmentLink.findUnique({
      where: { id: linkId },
      include: {
        customer: { select: { name: true, email: true } },
        assessment: { select: { name: true } },
      },
    });
    if (!link) throw new NotFoundException('Assessment link not found');
    if (link.agent_id !== agentId) throw new ForbiddenException('Not authorized');

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const linkUrl = `${frontendUrl}/assess/${link.token}`;

    await this.mailService.sendAssessmentLink(link.customer.email, link.customer.name, link.assessment.name, linkUrl);

    return { message: 'Link resent successfully', link_url: linkUrl };
  }

  async getResponseForLink(agentId: string, linkId: string) {
    const link = await this.prisma.assessmentLink.findUnique({
      where: { id: linkId },
      include: {
        customer: { select: { name: true } },
        insurance_provider: { select: { name: true } },
        assessment: { select: { name: true } },
        response: {
          include: {
            answers: {
              include: {
                question: {
                  select: { question_text: true, question_type: true, compartment: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!link) throw new NotFoundException('Assessment link not found');
    if (link.agent_id !== agentId) throw new ForbiddenException('Not authorized');

    return {
      data: {
        id: link.response?.id || null,
        assessment_link_id: link.id,
        assessment_name: link.assessment.name,
        customer_name: link.customer.name,
        insurance_provider_name: link.insurance_provider.name,
        status: link.status,
        progress_percent: link.progress_percent,
        answers: link.response ? link.response.answers.map((a) => ({
          question_id: a.question_id,
          question_text: a.question.question_text,
          question_type: a.question.question_type,
          compartment_name: a.question.compartment.name,
          answer: JSON.parse(a.answer),
        })) : [],
        filled_by: link.response?.filled_by || null,
        submitted_by: link.response?.submitted_by || null,
        submitted_at: link.response?.submitted_at?.toISOString() || null,
      },
    };
  }
}

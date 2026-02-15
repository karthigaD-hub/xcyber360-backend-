"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentPublicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AssessmentPublicService = class AssessmentPublicService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFormByToken(token) {
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
        if (!link)
            throw new common_1.NotFoundException('Invalid or expired assessment link');
        const allQuestions = link.assessment.assessment_questions.map((aq) => aq.question);
        const isConsolidation = link.insurance_provider.name.toLowerCase() === 'consolidation';
        const filteredQuestions = isConsolidation
            ? allQuestions
            : allQuestions.filter((q) => q.applicable_providers.some((p) => p.insurance_provider_id === link.insurance_provider_id));
        const compartmentMap = new Map();
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
        if (link.status === 'YET_TO_START') {
            await this.prisma.assessmentLink.update({
                where: { id: link.id },
                data: { status: 'IN_PROGRESS' },
            });
        }
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
    async saveDraft(token, answers, filledBy = 'USER') {
        const link = await this.prisma.assessmentLink.findUnique({ where: { token } });
        if (!link)
            throw new common_1.NotFoundException('Invalid assessment link');
        if (link.status === 'SUBMITTED')
            throw new common_1.ForbiddenException('Assessment already submitted');
        const totalQuestions = await this.prisma.assessmentQuestion.count({
            where: { assessment_id: link.assessment_id },
        });
        const answeredCount = answers.filter((a) => a.answer !== null && a.answer !== '' && a.answer !== undefined).length;
        const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
        let response = await this.prisma.response.findUnique({
            where: { assessment_link_id: link.id },
        });
        if (!response) {
            response = await this.prisma.response.create({
                data: { assessment_link_id: link.id, filled_by: filledBy },
            });
        }
        else {
            await this.prisma.response.update({
                where: { id: response.id },
                data: { filled_by: filledBy },
            });
        }
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
        await this.prisma.assessmentLink.update({
            where: { id: link.id },
            data: { status: 'IN_PROGRESS', progress_percent: progress },
        });
        return { message: 'Draft saved successfully', progress_percent: progress };
    }
    async submit(token, answers, filledBy, consentConfirmed, ip, userAgent) {
        const link = await this.prisma.assessmentLink.findUnique({ where: { token } });
        if (!link)
            throw new common_1.NotFoundException('Invalid assessment link');
        if (link.status === 'SUBMITTED')
            throw new common_1.ForbiddenException('Assessment already submitted');
        if (!consentConfirmed)
            throw new common_1.BadRequestException('Consent must be confirmed before submission');
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
        }
        else {
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
        await this.prisma.responseAnswer.createMany({
            data: answers.map((a) => ({
                response_id: response.id,
                question_id: a.question_id,
                answer: JSON.stringify(a.answer),
            })),
        });
        await this.prisma.assessmentLink.update({
            where: { id: link.id },
            data: { status: 'SUBMITTED', progress_percent: 100, submitted_at: new Date() },
        });
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
};
exports.AssessmentPublicService = AssessmentPublicService;
exports.AssessmentPublicService = AssessmentPublicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssessmentPublicService);
//# sourceMappingURL=assessment-public.service.js.map
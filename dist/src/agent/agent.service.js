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
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const mail_service_1 = require("../mail/mail.service");
const config_1 = require("@nestjs/config");
let AgentService = class AgentService {
    constructor(prisma, authService, mailService, config) {
        this.prisma = prisma;
        this.authService = authService;
        this.mailService = mailService;
        this.config = config;
    }
    async getDashboardStats(agentId) {
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
    async getAssignedLinks(agentId) {
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
    async getAssignedCustomers(agentId) {
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
    async createCustomer(agentId, data) {
        const existing = await this.prisma.customer.findUnique({ where: { email: data.email } });
        if (existing)
            throw new common_1.ConflictException('Customer with this email already exists');
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
        await this.mailService.sendLoginCredentials(data.email, data.name, 'Customer', tempPassword);
        return {
            data: { ...customer, created_at: customer.created_at.toISOString(), temp_password: tempPassword },
            message: 'Customer created successfully. Login credentials sent via email.',
        };
    }
    async resendLink(agentId, linkId) {
        const link = await this.prisma.assessmentLink.findUnique({
            where: { id: linkId },
            include: {
                customer: { select: { name: true, email: true } },
                assessment: { select: { name: true } },
            },
        });
        if (!link)
            throw new common_1.NotFoundException('Assessment link not found');
        if (link.agent_id !== agentId)
            throw new common_1.ForbiddenException('Not authorized');
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        const linkUrl = `${frontendUrl}/assess/${link.token}`;
        await this.mailService.sendAssessmentLink(link.customer.email, link.customer.name, link.assessment.name, linkUrl);
        return { message: 'Link resent successfully', link_url: linkUrl };
    }
    async getResponseForLink(agentId, linkId) {
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
        if (!link)
            throw new common_1.NotFoundException('Assessment link not found');
        if (link.agent_id !== agentId)
            throw new common_1.ForbiddenException('Not authorized');
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
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        mail_service_1.MailService,
        config_1.ConfigService])
], AgentService);
//# sourceMappingURL=agent.service.js.map
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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const mail_service_1 = require("../mail/mail.service");
const config_1 = require("@nestjs/config");
let AdminService = class AdminService {
    constructor(prisma, authService, mailService, config) {
        this.prisma = prisma;
        this.authService = authService;
        this.mailService = mailService;
        this.config = config;
    }
    async getDashboardStats() {
        const [total_customers, total_agents, total_providers, total_assessments, total_links, yet_to_start, in_progress, submitted,] = await Promise.all([
            this.prisma.customer.count(),
            this.prisma.agent.count(),
            this.prisma.insuranceProvider.count(),
            this.prisma.assessment.count(),
            this.prisma.assessmentLink.count(),
            this.prisma.assessmentLink.count({ where: { status: 'YET_TO_START' } }),
            this.prisma.assessmentLink.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.assessmentLink.count({ where: { status: 'SUBMITTED' } }),
        ]);
        const [yetToStartUsers, inProgressUsers, submittedUsers] = await Promise.all([
            this.prisma.assessmentLink.findMany({
                where: { status: 'YET_TO_START' },
                include: { customer: { select: { id: true, name: true, email: true } } },
            }),
            this.prisma.assessmentLink.findMany({
                where: { status: 'IN_PROGRESS' },
                include: { customer: { select: { id: true, name: true, email: true } } },
            }),
            this.prisma.assessmentLink.findMany({
                where: { status: 'SUBMITTED' },
                include: { customer: { select: { id: true, name: true, email: true } } },
            }),
        ]);
        return {
            data: {
                total_customers, total_agents, total_providers, total_assessments, total_links,
                yet_to_start, in_progress, submitted,
                yet_to_start_users: yetToStartUsers.map(l => ({ id: l.customer.id, name: l.customer.name, email: l.customer.email })),
                in_progress_users: inProgressUsers.map(l => ({ id: l.customer.id, name: l.customer.name, email: l.customer.email })),
                submitted_users: submittedUsers.map(l => ({ id: l.customer.id, name: l.customer.name, email: l.customer.email })),
            },
        };
    }
    async getAgents() {
        const agents = await this.prisma.agent.findMany({
            orderBy: { created_at: 'desc' },
            include: { _count: { select: { customers: true } } },
        });
        return {
            data: agents.map((a) => ({
                id: a.id, name: a.name, email: a.email, phone: a.phone,
                designation: a.designation, emp_id: a.emp_id,
                is_active: a.is_active, created_at: a.created_at.toISOString(),
                assigned_customers_count: a._count.customers,
            })),
            total: agents.length, page: 1, limit: agents.length,
        };
    }
    async createAgent(data) {
        const existing = await this.prisma.agent.findUnique({ where: { email: data.email } });
        if (existing)
            throw new common_1.ConflictException('Agent with this email already exists');
        const tempPassword = this.authService.generateTempPassword();
        const hashed = await this.authService.hashPassword(tempPassword);
        const agent = await this.prisma.agent.create({
            data: {
                name: data.name, email: data.email, password: hashed,
                phone: data.phone, designation: data.designation, emp_id: data.emp_id,
                must_change_password: true,
            },
        });
        await this.mailService.sendLoginCredentials(data.email, data.name, 'Agent', tempPassword);
        return {
            data: {
                id: agent.id, name: agent.name, email: agent.email, phone: agent.phone,
                designation: agent.designation, emp_id: agent.emp_id,
                is_active: agent.is_active, created_at: agent.created_at.toISOString(),
                temp_password: tempPassword,
            },
            message: 'Agent created successfully. Login credentials sent via email.',
        };
    }
    async updateAgent(id, data) {
        const agent = await this.prisma.agent.findUnique({ where: { id } });
        if (!agent)
            throw new common_1.NotFoundException('Agent not found');
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.designation !== undefined)
            updateData.designation = data.designation;
        if (data.emp_id !== undefined)
            updateData.emp_id = data.emp_id;
        if (data.is_active !== undefined)
            updateData.is_active = data.is_active;
        if (data.password)
            updateData.password = await this.authService.hashPassword(data.password);
        const updated = await this.prisma.agent.update({ where: { id }, data: updateData });
        return {
            data: {
                id: updated.id, name: updated.name, email: updated.email, phone: updated.phone,
                designation: updated.designation, emp_id: updated.emp_id,
                is_active: updated.is_active, created_at: updated.created_at.toISOString(),
            },
            message: 'Agent updated successfully',
        };
    }
    async deleteAgent(id) {
        const agent = await this.prisma.agent.findUnique({ where: { id } });
        if (!agent)
            throw new common_1.NotFoundException('Agent not found');
        await this.prisma.agent.delete({ where: { id } });
        return { message: 'Agent deleted successfully' };
    }
    async getCustomers() {
        const customers = await this.prisma.customer.findMany({
            orderBy: { created_at: 'desc' },
            include: { agent: { select: { name: true } } },
        });
        return {
            data: customers.map((c) => ({
                id: c.id, name: c.name, company_name: c.company_name, email: c.email,
                phone: c.phone, industry: c.industry, agent_id: c.agent_id,
                agent_name: c.agent?.name || null, created_at: c.created_at.toISOString(),
            })),
            total: customers.length, page: 1, limit: customers.length,
        };
    }
    async getProviders() {
        const providers = await this.prisma.insuranceProvider.findMany({ orderBy: { created_at: 'desc' } });
        return {
            data: providers.map((p) => ({ ...p, created_at: p.created_at.toISOString() })),
            total: providers.length, page: 1, limit: providers.length,
        };
    }
    async createProvider(data) {
        const existing = await this.prisma.insuranceProvider.findFirst({
            where: { OR: [{ name: data.name }, { code: data.code }] },
        });
        if (existing)
            throw new common_1.ConflictException('Insurance Provider with this name or code already exists');
        const provider = await this.prisma.insuranceProvider.create({ data });
        return { data: { ...provider, created_at: provider.created_at.toISOString() }, message: 'Insurance Provider created successfully' };
    }
    async updateProvider(id, data) {
        const provider = await this.prisma.insuranceProvider.findUnique({ where: { id } });
        if (!provider)
            throw new common_1.NotFoundException('Insurance Provider not found');
        const updated = await this.prisma.insuranceProvider.update({ where: { id }, data });
        return { data: { ...updated, created_at: updated.created_at.toISOString() }, message: 'Insurance Provider updated successfully' };
    }
    async deleteProvider(id) {
        const provider = await this.prisma.insuranceProvider.findUnique({ where: { id } });
        if (!provider)
            throw new common_1.NotFoundException('Insurance Provider not found');
        await this.prisma.insuranceProvider.delete({ where: { id } });
        return { message: 'Insurance Provider deleted successfully' };
    }
    async getCompartments() {
        const compartments = await this.prisma.compartment.findMany({
            orderBy: { order: 'asc' },
            include: { _count: { select: { questions: true } } },
        });
        return {
            data: compartments.map((c) => ({
                id: c.id, name: c.name, description: c.description,
                order: c.order, question_range: c.question_range,
                question_count: c._count.questions,
                created_at: c.created_at.toISOString(),
            })),
            total: compartments.length, page: 1, limit: compartments.length,
        };
    }
    async createCompartment(data) {
        const existing = await this.prisma.compartment.findUnique({ where: { name: data.name } });
        if (existing)
            throw new common_1.ConflictException('Compartment with this name already exists');
        const compartment = await this.prisma.compartment.create({
            data: { name: data.name, description: data.description, order: data.order ?? 0, question_range: data.question_range },
        });
        return { data: { ...compartment, question_count: 0, created_at: compartment.created_at.toISOString() }, message: 'Compartment created successfully' };
    }
    async updateCompartment(id, data) {
        const compartment = await this.prisma.compartment.findUnique({ where: { id } });
        if (!compartment)
            throw new common_1.NotFoundException('Compartment not found');
        const updated = await this.prisma.compartment.update({ where: { id }, data });
        return { data: { ...updated, created_at: updated.created_at.toISOString() }, message: 'Compartment updated successfully' };
    }
    async deleteCompartment(id) {
        const compartment = await this.prisma.compartment.findUnique({ where: { id } });
        if (!compartment)
            throw new common_1.NotFoundException('Compartment not found');
        await this.prisma.compartment.delete({ where: { id } });
        return { message: 'Compartment deleted successfully' };
    }
    async getQuestions(params) {
        const where = {};
        if (params?.compartment_id)
            where.compartment_id = params.compartment_id;
        if (params?.is_active !== undefined)
            where.is_active = params.is_active === 'true';
        if (params?.provider_id) {
            if (params.provider_id === 'CONSOLIDATION') {
            }
            else {
                where.applicable_providers = { some: { insurance_provider_id: params.provider_id } };
            }
        }
        const questions = await this.prisma.question.findMany({
            where,
            orderBy: [{ order: 'asc' }, { created_at: 'desc' }],
            include: {
                compartment: { select: { name: true } },
                applicable_providers: { include: { insurance_provider: { select: { id: true, name: true } } } },
            },
        });
        return {
            data: questions.map((q, idx) => ({
                id: q.id, question_text: q.question_text,
                question_type: q.question_type, options: q.options,
                compartment_id: q.compartment_id, compartment_name: q.compartment.name,
                risk_weight: q.risk_weight, order: q.order || idx + 1,
                applicable_providers: q.applicable_providers.map((p) => p.insurance_provider_id),
                applicable_provider_names: q.applicable_providers.map((p) => p.insurance_provider.name),
                is_active: q.is_active, created_at: q.created_at.toISOString(),
            })),
            total: questions.length, page: 1, limit: questions.length,
        };
    }
    async createQuestion(data) {
        const compartment = await this.prisma.compartment.findUnique({ where: { id: data.compartment_id } });
        if (!compartment)
            throw new common_1.BadRequestException('Compartment not found');
        if (data.question_type === 'MCQ' && (!data.options || data.options.length < 2)) {
            throw new common_1.BadRequestException('MCQ questions must have at least 2 options');
        }
        const question = await this.prisma.question.create({
            data: {
                question_text: data.question_text,
                question_type: data.question_type,
                options: data.options || [],
                compartment_id: data.compartment_id,
                risk_weight: data.risk_weight,
                order: data.order ?? 0,
                applicable_providers: {
                    create: data.applicable_providers.map((pid) => ({ insurance_provider_id: pid })),
                },
            },
            include: {
                compartment: { select: { name: true } },
                applicable_providers: { include: { insurance_provider: { select: { id: true, name: true } } } },
            },
        });
        return {
            data: {
                id: question.id, question_text: question.question_text,
                question_type: question.question_type, options: question.options,
                compartment_id: question.compartment_id, compartment_name: question.compartment.name,
                risk_weight: question.risk_weight, order: question.order,
                applicable_providers: question.applicable_providers.map((p) => p.insurance_provider_id),
                applicable_provider_names: question.applicable_providers.map((p) => p.insurance_provider.name),
                is_active: question.is_active, created_at: question.created_at.toISOString(),
            },
            message: 'Question created successfully',
        };
    }
    async updateQuestion(id, data) {
        const question = await this.prisma.question.findUnique({ where: { id } });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        const updateData = {};
        if (data.question_text !== undefined)
            updateData.question_text = data.question_text;
        if (data.question_type !== undefined)
            updateData.question_type = data.question_type;
        if (data.options !== undefined)
            updateData.options = data.options;
        if (data.compartment_id !== undefined)
            updateData.compartment_id = data.compartment_id;
        if (data.risk_weight !== undefined)
            updateData.risk_weight = data.risk_weight;
        if (data.is_active !== undefined)
            updateData.is_active = data.is_active;
        if (data.order !== undefined)
            updateData.order = data.order;
        if (data.applicable_providers) {
            await this.prisma.questionProvider.deleteMany({ where: { question_id: id } });
            updateData.applicable_providers = {
                create: data.applicable_providers.map((pid) => ({ insurance_provider_id: pid })),
            };
        }
        const updated = await this.prisma.question.update({
            where: { id }, data: updateData,
            include: {
                compartment: { select: { name: true } },
                applicable_providers: { include: { insurance_provider: { select: { id: true, name: true } } } },
            },
        });
        return {
            data: {
                id: updated.id, question_text: updated.question_text,
                question_type: updated.question_type, options: updated.options,
                compartment_id: updated.compartment_id, compartment_name: updated.compartment.name,
                risk_weight: updated.risk_weight, order: updated.order,
                applicable_providers: updated.applicable_providers.map((p) => p.insurance_provider_id),
                applicable_provider_names: updated.applicable_providers.map((p) => p.insurance_provider.name),
                is_active: updated.is_active, created_at: updated.created_at.toISOString(),
            },
            message: 'Question updated successfully',
        };
    }
    async deleteQuestion(id) {
        const question = await this.prisma.question.findUnique({ where: { id } });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        await this.prisma.question.delete({ where: { id } });
        return { message: 'Question deleted successfully' };
    }
    async bulkUploadQuestions(fileBuffer, fileName) {
        const rows = await this.parseFile(fileBuffer, fileName);
        const result = { total: rows.length, success: 0, failed: 0, errors: [], created_compartments: [] };
        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];
                if (!row.question || !row.type) {
                    result.errors.push({ row: i + 1, message: 'Missing question text or type' });
                    result.failed++;
                    continue;
                }
                let compartment = await this.prisma.compartment.findUnique({ where: { name: row.compartment || 'General' } });
                if (!compartment) {
                    compartment = await this.prisma.compartment.create({ data: { name: row.compartment || 'General' } });
                    result.created_compartments.push(compartment.name);
                }
                const providerNames = (row.providers || '').split(';').map((s) => s.trim()).filter(Boolean);
                const providerIds = [];
                for (const pName of providerNames) {
                    const provider = await this.prisma.insuranceProvider.findUnique({ where: { name: pName } });
                    if (provider)
                        providerIds.push(provider.id);
                }
                const questionType = this.mapQuestionType(row.type);
                const options = row.options ? row.options.split(';').map((s) => s.trim()) : [];
                await this.prisma.question.create({
                    data: {
                        question_text: row.question,
                        question_type: questionType,
                        options,
                        compartment_id: compartment.id,
                        risk_weight: parseInt(row.risk) || 5,
                        order: parseInt(row.order) || 0,
                        applicable_providers: {
                            create: providerIds.map((pid) => ({ insurance_provider_id: pid })),
                        },
                    },
                });
                result.success++;
            }
            catch (err) {
                result.errors.push({ row: i + 1, message: err.message || 'Unknown error' });
                result.failed++;
            }
        }
        return { data: result, message: `Uploaded ${result.success} of ${result.total} questions` };
    }
    async parseFile(buffer, fileName) {
        if (fileName.endsWith('.csv')) {
            return this.parseCsv(buffer);
        }
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        const rows = [];
        const headers = [];
        sheet.eachRow((row, rowNum) => {
            if (rowNum === 1) {
                row.eachCell((cell) => headers.push(String(cell.value).toLowerCase().trim()));
                return;
            }
            const obj = {};
            row.eachCell((cell, colNum) => {
                obj[headers[colNum - 1] || `col${colNum}`] = String(cell.value || '');
            });
            rows.push(obj);
        });
        return rows;
    }
    parseCsv(buffer) {
        return new Promise((resolve) => {
            const lines = buffer.toString('utf-8').split('\n').filter(Boolean);
            if (lines.length < 2)
                return resolve([]);
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
            const rows = lines.slice(1).map((line) => {
                const vals = line.split(',');
                const obj = {};
                headers.forEach((h, i) => (obj[h] = (vals[i] || '').trim()));
                return obj;
            });
            resolve(rows);
        });
    }
    mapQuestionType(type) {
        const map = {
            yes_no: 'YES_NO', yesno: 'YES_NO', 'yes/no': 'YES_NO',
            mcq: 'MCQ', 'multiple choice': 'MCQ', multiple_choice: 'MCQ',
            text: 'TEXT', free_text: 'TEXT', freetext: 'TEXT',
            number: 'NUMBER', numeric: 'NUMBER',
            reflexive: 'REFLEXIVE',
            paragraph: 'PARAGRAPH',
            checkbox: 'CHECKBOX',
        };
        return map[type.toLowerCase()] || 'TEXT';
    }
    async getAssessments() {
        const assessments = await this.prisma.assessment.findMany({
            orderBy: { created_at: 'desc' },
            include: { _count: { select: { assessment_questions: true, assessment_links: true } } },
        });
        return {
            data: assessments.map((a) => ({
                id: a.id, name: a.name, description: a.description,
                status: a.status, question_count: a._count.assessment_questions,
                link_count: a._count.assessment_links,
                created_at: a.created_at.toISOString(),
            })),
            total: assessments.length, page: 1, limit: assessments.length,
        };
    }
    async createAssessment(data) {
        if (!data.question_ids || data.question_ids.length === 0) {
            throw new common_1.BadRequestException('At least one question is required');
        }
        const assessment = await this.prisma.assessment.create({
            data: {
                name: data.name, description: data.description,
                assessment_questions: {
                    create: data.question_ids.map((qid, idx) => ({ question_id: qid, order: idx + 1 })),
                },
            },
            include: { _count: { select: { assessment_questions: true } } },
        });
        return {
            data: {
                id: assessment.id, name: assessment.name, description: assessment.description,
                status: assessment.status, question_count: assessment._count.assessment_questions,
                created_at: assessment.created_at.toISOString(),
            },
            message: 'Assessment created successfully',
        };
    }
    async updateAssessment(id, data) {
        const assessment = await this.prisma.assessment.findUnique({ where: { id } });
        if (!assessment)
            throw new common_1.NotFoundException('Assessment not found');
        const updated = await this.prisma.assessment.update({ where: { id }, data });
        return { data: { ...updated, created_at: updated.created_at.toISOString() }, message: 'Assessment updated successfully' };
    }
    async getAssessmentLinks(params) {
        const where = {};
        if (params?.status)
            where.status = params.status;
        if (params?.provider_id)
            where.insurance_provider_id = params.provider_id;
        if (params?.customer_name) {
            where.customer = { name: { contains: params.customer_name, mode: 'insensitive' } };
        }
        const links = await this.prisma.assessmentLink.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                assessment: { select: { name: true } },
                customer: { select: { name: true, email: true } },
                insurance_provider: { select: { name: true } },
                agent: { select: { name: true } },
            },
        });
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        return {
            data: links.map((l) => ({
                id: l.id,
                assessment_id: l.assessment_id, assessment_name: l.assessment.name,
                customer_id: l.customer_id, customer_name: l.customer.name, customer_email: l.customer.email,
                insurance_provider_id: l.insurance_provider_id, insurance_provider_name: l.insurance_provider.name,
                agent_id: l.agent_id, agent_name: l.agent?.name || null,
                token: l.token, link_url: `${frontendUrl}/assess/${l.token}`,
                status: l.status, progress_percent: l.progress_percent,
                submitted_at: l.submitted_at?.toISOString() || null,
                created_at: l.created_at.toISOString(),
            })),
            total: links.length, page: 1, limit: links.length,
        };
    }
    async createAssessmentLink(data) {
        const [assessment, customer, provider] = await Promise.all([
            this.prisma.assessment.findUnique({ where: { id: data.assessment_id } }),
            this.prisma.customer.findUnique({ where: { id: data.customer_id } }),
            this.prisma.insuranceProvider.findUnique({ where: { id: data.insurance_provider_id } }),
        ]);
        if (!assessment)
            throw new common_1.BadRequestException('Assessment not found');
        if (!customer)
            throw new common_1.BadRequestException('Customer not found');
        if (!provider)
            throw new common_1.BadRequestException('Insurance Provider not found');
        if (assessment.status !== 'ACTIVE')
            throw new common_1.BadRequestException('Assessment must be ACTIVE to generate links');
        const link = await this.prisma.assessmentLink.create({
            data: {
                assessment_id: data.assessment_id,
                customer_id: data.customer_id,
                insurance_provider_id: data.insurance_provider_id,
                agent_id: data.agent_id || null,
            },
            include: {
                assessment: { select: { name: true } },
                customer: { select: { name: true, email: true } },
                insurance_provider: { select: { name: true } },
                agent: { select: { name: true } },
            },
        });
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        const linkUrl = `${frontendUrl}/assess/${link.token}`;
        await this.mailService.sendAssessmentLink(link.customer.email, link.customer.name, link.assessment.name, linkUrl);
        return {
            data: {
                id: link.id,
                assessment_id: link.assessment_id, assessment_name: link.assessment.name,
                customer_id: link.customer_id, customer_name: link.customer.name,
                insurance_provider_id: link.insurance_provider_id, insurance_provider_name: link.insurance_provider.name,
                agent_id: link.agent_id, agent_name: link.agent?.name || null,
                token: link.token, link_url: linkUrl,
                status: link.status, progress_percent: link.progress_percent,
                submitted_at: null, created_at: link.created_at.toISOString(),
            },
            message: 'Assessment link created and email sent to customer.',
        };
    }
    async getAllResponses(params) {
        const where = { status: 'SUBMITTED' };
        if (params?.provider_id)
            where.insurance_provider_id = params.provider_id;
        if (params?.customer_name) {
            where.customer = { name: { contains: params.customer_name, mode: 'insensitive' } };
        }
        const links = await this.prisma.assessmentLink.findMany({
            where,
            orderBy: { submitted_at: 'desc' },
            include: {
                customer: { select: { name: true } },
                insurance_provider: { select: { name: true } },
                assessment: { select: { name: true } },
                agent: { select: { name: true } },
                response: { select: { filled_by: true, submitted_by: true, submitted_at: true } },
            },
        });
        return {
            data: links.map(l => ({
                id: l.id,
                assessment_link_id: l.id,
                assessment_name: l.assessment.name,
                customer_name: l.customer.name,
                insurance_provider_name: l.insurance_provider.name,
                agent_name: l.agent?.name || null,
                filled_by: l.response?.filled_by || 'USER',
                submitted_by: l.response?.submitted_by || 'USER',
                submitted_at: l.response?.submitted_at?.toISOString() || l.submitted_at?.toISOString() || null,
                status: l.status,
                progress_percent: l.progress_percent,
            })),
            total: links.length, page: 1, limit: links.length,
        };
    }
    async getResponse(linkId) {
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
        if (!link.response)
            throw new common_1.NotFoundException('No response submitted yet');
        return {
            data: {
                id: link.response.id,
                assessment_link_id: link.id,
                assessment_name: link.assessment.name,
                customer_name: link.customer.name,
                insurance_provider_name: link.insurance_provider.name,
                answers: link.response.answers.map((a) => ({
                    question_id: a.question_id,
                    question_text: a.question.question_text,
                    question_type: a.question.question_type,
                    compartment_name: a.question.compartment.name,
                    answer: JSON.parse(a.answer),
                })),
                filled_by: link.response.filled_by,
                submitted_by: link.response.submitted_by,
                consent_confirmed: link.response.consent_confirmed,
                submitted_at: link.response.submitted_at?.toISOString() || null,
                ip_address: link.response.ip_address,
                user_agent: link.response.user_agent,
            },
        };
    }
    async exportResponses(linkId, format) {
        const responseData = await this.getResponse(linkId);
        const data = responseData.data;
        if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Responses');
            sheet.columns = [
                { header: '#', key: 'num', width: 5 },
                { header: 'Section', key: 'section', width: 25 },
                { header: 'Question', key: 'question', width: 50 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Answer', key: 'answer', width: 40 },
            ];
            const infoSheet = workbook.addWorksheet('Info');
            infoSheet.addRow(['Assessment', data.assessment_name]);
            infoSheet.addRow(['Customer', data.customer_name]);
            infoSheet.addRow(['Insurance Provider', data.insurance_provider_name]);
            infoSheet.addRow(['Filled By', data.filled_by]);
            infoSheet.addRow(['Submitted By', data.submitted_by]);
            infoSheet.addRow(['Submitted At', data.submitted_at]);
            data.answers.forEach((a, i) => {
                sheet.addRow({
                    num: i + 1,
                    section: a.compartment_name || '',
                    question: a.question_text,
                    type: a.question_type,
                    answer: typeof a.answer === 'object' ? JSON.stringify(a.answer) : String(a.answer),
                });
            });
            return workbook.xlsx.writeBuffer();
        }
        const PDFDocument = require('pdfkit');
        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(20).text('X-Cyber360 Assessment Response', { align: 'center' });
            doc.moveDown();
            doc.fontSize(11).text(`Assessment: ${data.assessment_name}`);
            doc.text(`Customer: ${data.customer_name}`);
            doc.text(`Insurance Provider: ${data.insurance_provider_name}`);
            doc.text(`Submitted: ${data.submitted_at}`);
            doc.text(`Filled By: ${data.filled_by} | Submitted By: ${data.submitted_by}`);
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
            let currentSection = '';
            data.answers.forEach((a, i) => {
                if (a.compartment_name && a.compartment_name !== currentSection) {
                    currentSection = a.compartment_name;
                    doc.moveDown(0.5);
                    doc.fontSize(14).fillColor('#0066cc').text(`§ ${currentSection}`);
                    doc.fillColor('#000000');
                    doc.moveDown(0.3);
                }
                doc.fontSize(10).text(`${i + 1}. ${a.question_text}`);
                const ansStr = typeof a.answer === 'object' ? JSON.stringify(a.answer) : String(a.answer);
                doc.fontSize(10).fillColor('#333333').text(`   Answer: ${ansStr}`, { indent: 15 });
                doc.fillColor('#000000');
                doc.moveDown(0.4);
            });
            doc.end();
        });
    }
    async getAuditLogs(params) {
        const where = {};
        if (params?.entity_type)
            where.entity_type = params.entity_type;
        if (params?.performed_by)
            where.performed_by = params.performed_by;
        if (params?.action)
            where.action = params.action;
        const logs = await this.prisma.auditLog.findMany({
            where, orderBy: { created_at: 'desc' }, take: 500,
        });
        return {
            data: logs.map((l) => ({
                id: l.id, action: l.action, entity_type: l.entity_type,
                entity_id: l.entity_id, performed_by: l.performed_by,
                performer_role: l.performer_role, details: l.details,
                ip_address: l.ip_address, user_agent: l.user_agent,
                created_at: l.created_at.toISOString(),
            })),
            total: logs.length, page: 1, limit: 500,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        mail_service_1.MailService,
        config_1.ConfigService])
], AdminService);
//# sourceMappingURL=admin.service.js.map
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
export declare class AdminService {
    private prisma;
    private authService;
    private mailService;
    private config;
    constructor(prisma: PrismaService, authService: AuthService, mailService: MailService, config: ConfigService);
    getDashboardStats(): Promise<{
        data: {
            total_customers: number;
            total_agents: number;
            total_providers: number;
            total_assessments: number;
            total_links: number;
            yet_to_start: number;
            in_progress: number;
            submitted: number;
            yet_to_start_users: {
                id: string;
                name: string;
                email: string;
            }[];
            in_progress_users: {
                id: string;
                name: string;
                email: string;
            }[];
            submitted_users: {
                id: string;
                name: string;
                email: string;
            }[];
        };
    }>;
    getAgents(): Promise<{
        data: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            designation: string | null;
            emp_id: string | null;
            is_active: boolean;
            created_at: string;
            assigned_customers_count: number;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createAgent(data: {
        name: string;
        email: string;
        phone?: string;
        designation?: string;
        emp_id?: string;
    }): Promise<{
        data: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            designation: string | null;
            emp_id: string | null;
            is_active: boolean;
            created_at: string;
            temp_password: string;
        };
        message: string;
    }>;
    updateAgent(id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        is_active?: boolean;
        password?: string;
        designation?: string;
        emp_id?: string;
    }): Promise<{
        data: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            designation: string | null;
            emp_id: string | null;
            is_active: boolean;
            created_at: string;
        };
        message: string;
    }>;
    deleteAgent(id: string): Promise<{
        message: string;
    }>;
    getCustomers(): Promise<{
        data: {
            id: string;
            name: string;
            company_name: string;
            email: string;
            phone: string | null;
            industry: string | null;
            agent_id: string | null;
            agent_name: string | null;
            created_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getProviders(): Promise<{
        data: {
            created_at: string;
            id: string;
            name: string;
            is_active: boolean;
            updated_at: Date;
            code: string;
            contact_email: string | null;
            contact_phone: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createProvider(data: {
        name: string;
        code: string;
        contact_email?: string;
        contact_phone?: string;
    }): Promise<{
        data: {
            created_at: string;
            id: string;
            name: string;
            is_active: boolean;
            updated_at: Date;
            code: string;
            contact_email: string | null;
            contact_phone: string | null;
        };
        message: string;
    }>;
    updateProvider(id: string, data: Partial<{
        name: string;
        code: string;
        contact_email: string;
        contact_phone: string;
        is_active: boolean;
    }>): Promise<{
        data: {
            created_at: string;
            id: string;
            name: string;
            is_active: boolean;
            updated_at: Date;
            code: string;
            contact_email: string | null;
            contact_phone: string | null;
        };
        message: string;
    }>;
    deleteProvider(id: string): Promise<{
        message: string;
    }>;
    getCompartments(): Promise<{
        data: {
            id: string;
            name: string;
            description: string | null;
            order: number;
            question_range: string | null;
            question_count: number;
            created_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createCompartment(data: {
        name: string;
        description?: string;
        order?: number;
        question_range?: string;
    }): Promise<{
        data: {
            question_count: number;
            created_at: string;
            id: string;
            name: string;
            updated_at: Date;
            description: string | null;
            order: number;
            question_range: string | null;
        };
        message: string;
    }>;
    updateCompartment(id: string, data: Partial<{
        name: string;
        description: string;
        order: number;
        question_range: string;
    }>): Promise<{
        data: {
            created_at: string;
            id: string;
            name: string;
            updated_at: Date;
            description: string | null;
            order: number;
            question_range: string | null;
        };
        message: string;
    }>;
    deleteCompartment(id: string): Promise<{
        message: string;
    }>;
    getQuestions(params?: {
        compartment_id?: string;
        provider_id?: string;
        is_active?: string;
    }): Promise<{
        data: {
            id: string;
            question_text: string;
            question_type: import(".prisma/client").$Enums.QuestionType;
            options: string[];
            compartment_id: string;
            compartment_name: string;
            risk_weight: number;
            order: number;
            applicable_providers: string[];
            applicable_provider_names: string[];
            is_active: boolean;
            created_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createQuestion(data: {
        question_text: string;
        question_type: string;
        options?: string[];
        compartment_id: string;
        risk_weight: number;
        applicable_providers: string[];
        order?: number;
    }): Promise<{
        data: {
            id: string;
            question_text: string;
            question_type: import(".prisma/client").$Enums.QuestionType;
            options: string[];
            compartment_id: string;
            compartment_name: string;
            risk_weight: number;
            order: number;
            applicable_providers: string[];
            applicable_provider_names: string[];
            is_active: boolean;
            created_at: string;
        };
        message: string;
    }>;
    updateQuestion(id: string, data: Partial<{
        question_text: string;
        question_type: string;
        options: string[];
        compartment_id: string;
        risk_weight: number;
        applicable_providers: string[];
        is_active: boolean;
        order: number;
    }>): Promise<{
        data: {
            id: string;
            question_text: string;
            question_type: import(".prisma/client").$Enums.QuestionType;
            options: string[];
            compartment_id: string;
            compartment_name: string;
            risk_weight: number;
            order: number;
            applicable_providers: string[];
            applicable_provider_names: string[];
            is_active: boolean;
            created_at: string;
        };
        message: string;
    }>;
    deleteQuestion(id: string): Promise<{
        message: string;
    }>;
    bulkUploadQuestions(fileBuffer: Buffer, fileName: string): Promise<{
        data: {
            total: number;
            success: number;
            failed: number;
            errors: any[];
            created_compartments: string[];
        };
        message: string;
    }>;
    private parseFile;
    private parseCsv;
    private mapQuestionType;
    getAssessments(): Promise<{
        data: {
            id: string;
            name: string;
            description: string | null;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            question_count: number;
            link_count: number;
            created_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createAssessment(data: {
        name: string;
        description?: string;
        question_ids: string[];
    }): Promise<{
        data: {
            id: string;
            name: string;
            description: string | null;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            question_count: number;
            created_at: string;
        };
        message: string;
    }>;
    updateAssessment(id: string, data: Partial<{
        name: string;
        description: string;
        status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
    }>): Promise<{
        data: {
            created_at: string;
            id: string;
            name: string;
            updated_at: Date;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            description: string | null;
        };
        message: string;
    }>;
    getAssessmentLinks(params?: {
        status?: string;
        provider_id?: string;
        customer_name?: string;
    }): Promise<{
        data: {
            id: string;
            assessment_id: string;
            assessment_name: string;
            customer_id: string;
            customer_name: string;
            customer_email: string;
            insurance_provider_id: string;
            insurance_provider_name: string;
            agent_id: string | null;
            agent_name: string | null;
            token: string;
            link_url: string;
            status: import(".prisma/client").$Enums.LinkStatus;
            progress_percent: number;
            submitted_at: string | null;
            created_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createAssessmentLink(data: {
        assessment_id: string;
        customer_id: string;
        insurance_provider_id: string;
        agent_id?: string;
    }): Promise<{
        data: {
            id: string;
            assessment_id: string;
            assessment_name: string;
            customer_id: string;
            customer_name: string;
            insurance_provider_id: string;
            insurance_provider_name: string;
            agent_id: string | null;
            agent_name: string | null;
            token: string;
            link_url: string;
            status: import(".prisma/client").$Enums.LinkStatus;
            progress_percent: number;
            submitted_at: null;
            created_at: string;
        };
        message: string;
    }>;
    getAllResponses(params?: {
        provider_id?: string;
        customer_name?: string;
    }): Promise<{
        data: {
            id: string;
            assessment_link_id: string;
            assessment_name: string;
            customer_name: string;
            insurance_provider_name: string;
            agent_name: string | null;
            filled_by: import(".prisma/client").$Enums.FilledBy;
            submitted_by: import(".prisma/client").$Enums.FilledBy;
            submitted_at: string | null;
            status: import(".prisma/client").$Enums.LinkStatus;
            progress_percent: number;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getResponse(linkId: string): Promise<{
        data: {
            id: string;
            assessment_link_id: string;
            assessment_name: string;
            customer_name: string;
            insurance_provider_name: string;
            answers: {
                question_id: string;
                question_text: string;
                question_type: import(".prisma/client").$Enums.QuestionType;
                compartment_name: string;
                answer: any;
            }[];
            filled_by: import(".prisma/client").$Enums.FilledBy;
            submitted_by: import(".prisma/client").$Enums.FilledBy;
            consent_confirmed: boolean;
            submitted_at: string | null;
            ip_address: string | null;
            user_agent: string | null;
        };
    }>;
    exportResponses(linkId: string, format: 'excel' | 'pdf'): Promise<any>;
    getAuditLogs(params?: {
        entity_type?: string;
        performed_by?: string;
        action?: string;
    }): Promise<{
        data: {
            id: string;
            action: string;
            entity_type: string;
            entity_id: string;
            performed_by: string;
            performer_role: string;
            details: string | null;
            ip_address: string | null;
            user_agent: string | null;
            created_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
}

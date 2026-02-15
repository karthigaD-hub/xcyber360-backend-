import { Response } from 'express';
import { AdminService } from './admin.service';
declare class CreateAgentDto {
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    emp_id?: string;
}
declare class UpdateAgentDto {
    name?: string;
    email?: string;
    phone?: string;
    designation?: string;
    emp_id?: string;
    is_active?: boolean;
    password?: string;
}
declare class CreateProviderDto {
    name: string;
    code: string;
    contact_email?: string;
    contact_phone?: string;
}
declare class UpdateProviderDto {
    name?: string;
    code?: string;
    contact_email?: string;
    contact_phone?: string;
    is_active?: boolean;
}
declare class CreateCompartmentDto {
    name: string;
    description?: string;
    order?: number;
    question_range?: string;
}
declare class UpdateCompartmentDto {
    name?: string;
    description?: string;
    order?: number;
    question_range?: string;
}
declare class CreateQuestionDto {
    question_text: string;
    question_type: string;
    options?: string[];
    compartment_id: string;
    risk_weight: number;
    applicable_providers: string[];
    order?: number;
}
declare class UpdateQuestionDto {
    question_text?: string;
    question_type?: string;
    options?: string[];
    compartment_id?: string;
    risk_weight?: number;
    applicable_providers?: string[];
    is_active?: boolean;
    order?: number;
}
declare class CreateAssessmentDto {
    name: string;
    description?: string;
    question_ids: string[];
}
declare class UpdateAssessmentDto {
    name?: string;
    description?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
}
declare class CreateAssessmentLinkDto {
    assessment_id: string;
    customer_id: string;
    insurance_provider_id: string;
    agent_id?: string;
}
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
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
    createAgent(dto: CreateAgentDto): Promise<{
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
    updateAgent(id: string, dto: UpdateAgentDto): Promise<{
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
    createProvider(dto: CreateProviderDto): Promise<{
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
    updateProvider(id: string, dto: UpdateProviderDto): Promise<{
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
    createCompartment(dto: CreateCompartmentDto): Promise<{
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
    updateCompartment(id: string, dto: UpdateCompartmentDto): Promise<{
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
    getQuestions(query: any): Promise<{
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
    createQuestion(dto: CreateQuestionDto): Promise<{
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
    updateQuestion(id: string, dto: UpdateQuestionDto): Promise<{
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
    bulkUpload(file: Express.Multer.File): Promise<{
        data: {
            total: number;
            success: number;
            failed: number;
            errors: any[];
            created_compartments: string[];
        };
        message: string;
    }>;
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
    createAssessment(dto: CreateAssessmentDto): Promise<{
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
    updateAssessment(id: string, dto: UpdateAssessmentDto): Promise<{
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
    getLinks(query: any): Promise<{
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
    createLink(dto: CreateAssessmentLinkDto): Promise<{
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
    getAllResponses(query: any): Promise<{
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
    exportResponse(linkId: string, format: 'excel' | 'pdf', res: Response): Promise<void>;
    getAuditLogs(query: any): Promise<{
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
export {};

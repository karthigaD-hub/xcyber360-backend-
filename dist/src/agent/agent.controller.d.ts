import { AgentService } from './agent.service';
declare class CreateCustomerDto {
    name: string;
    company_name: string;
    email: string;
    phone?: string;
    industry?: string;
}
export declare class AgentController {
    private agentService;
    constructor(agentService: AgentService);
    getDashboard(req: any): Promise<{
        data: {
            assigned_customers: number;
            total_assessments: number;
            yet_to_start: number;
            in_progress: number;
            submitted: number;
            total_links: number;
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
    getLinks(req: any): Promise<{
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
            agent_name: null;
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
    getCustomers(req: any): Promise<{
        data: {
            id: string;
            name: string;
            company_name: string;
            email: string;
            phone: string | null;
            industry: string | null;
            agent_id: string | null;
            created_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createCustomer(req: any, dto: CreateCustomerDto): Promise<{
        data: {
            created_at: string;
            temp_password: string;
            id: string;
            name: string;
            email: string;
            password: string;
            must_change_password: boolean;
            is_active: boolean;
            updated_at: Date;
            phone: string | null;
            failed_login_attempts: number;
            account_locked_until: Date | null;
            company_name: string;
            industry: string | null;
            agent_id: string | null;
        };
        message: string;
    }>;
    resendLink(req: any, id: string): Promise<{
        message: string;
        link_url: string;
    }>;
    getResponse(req: any, linkId: string): Promise<{
        data: {
            id: string | null;
            assessment_link_id: string;
            assessment_name: string;
            customer_name: string;
            insurance_provider_name: string;
            status: import(".prisma/client").$Enums.LinkStatus;
            progress_percent: number;
            answers: {
                question_id: string;
                question_text: string;
                question_type: import(".prisma/client").$Enums.QuestionType;
                compartment_name: string;
                answer: any;
            }[];
            filled_by: import(".prisma/client").$Enums.FilledBy | null;
            submitted_by: import(".prisma/client").$Enums.FilledBy | null;
            submitted_at: string | null;
        };
    }>;
}
export {};

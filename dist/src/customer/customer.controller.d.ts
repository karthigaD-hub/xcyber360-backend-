import { CustomerService } from './customer.service';
export declare class CustomerController {
    private customerService;
    constructor(customerService: CustomerService);
    getDashboard(req: any): Promise<{
        data: {
            total_links: number;
            yet_to_start: number;
            in_progress: number;
            submitted: number;
            links: {
                id: string;
                assessment_name: string;
                insurance_provider_name: string;
                agent_name: string | null;
                token: string;
                link_url: string;
                status: import(".prisma/client").$Enums.LinkStatus;
                progress_percent: number;
                submitted_at: string | null;
                created_at: string;
            }[];
        };
    }>;
}

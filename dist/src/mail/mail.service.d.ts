import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private readonly logger;
    private transporter?;
    constructor(config: ConfigService);
    sendLoginCredentials(to: string, name: string, role: string, tempPassword: string): Promise<void>;
    sendAssessmentLink(to: string, customerName: string, assessmentName: string, linkUrl: string): Promise<void>;
}

import { PrismaService } from '../prisma/prisma.service';
export declare class AssessmentPublicService {
    private prisma;
    constructor(prisma: PrismaService);
    getFormByToken(token: string): Promise<{
        data: {
            assessment_name: string;
            customer_name: string;
            insurance_provider_name: string;
            compartments: any[];
            total_questions: number;
            draft_answers: {
                question_id: string;
                answer: any;
            }[];
            status: string;
            is_submitted: boolean;
            progress_percent: number;
        };
    }>;
    saveDraft(token: string, answers: {
        question_id: string;
        answer: any;
    }[], filledBy?: 'USER' | 'AGENT'): Promise<{
        message: string;
        progress_percent: number;
    }>;
    submit(token: string, answers: {
        question_id: string;
        answer: any;
    }[], filledBy: 'USER' | 'AGENT', consentConfirmed: boolean, ip?: string, userAgent?: string): Promise<{
        message: string;
    }>;
}

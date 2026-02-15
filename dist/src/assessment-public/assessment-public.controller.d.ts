import { AssessmentPublicService } from './assessment-public.service';
import { Request } from 'express';
declare class AnswerDto {
    question_id: string;
    answer: any;
}
declare class SaveDraftDto {
    answers: AnswerDto[];
    filled_by?: 'USER' | 'AGENT';
}
declare class SubmitDto {
    answers: AnswerDto[];
    filled_by: 'USER' | 'AGENT';
    consent_confirmed: boolean;
}
export declare class AssessmentPublicController {
    private service;
    constructor(service: AssessmentPublicService);
    getForm(token: string): Promise<{
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
    saveDraft(token: string, dto: SaveDraftDto): Promise<{
        message: string;
        progress_percent: number;
    }>;
    submit(token: string, dto: SubmitDto, req: Request): Promise<{
        message: string;
    }>;
}
export {};

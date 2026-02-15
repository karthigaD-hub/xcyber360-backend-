import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { AssessmentPublicService } from './assessment-public.service';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Request } from 'express';

class AnswerDto {
  @IsString() @IsNotEmpty() question_id!: string;
  @IsNotEmpty() answer: any;
}

class SaveDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @IsOptional()
  @IsEnum(['USER', 'AGENT'])
  filled_by?: 'USER' | 'AGENT';
}

class SubmitDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @IsEnum(['USER', 'AGENT'])
  filled_by!: 'USER' | 'AGENT';

  @IsBoolean()
  consent_confirmed!: boolean;
}

@Controller('assessment')
export class AssessmentPublicController {
  constructor(private service: AssessmentPublicService) {}

  @Get(':token')
  getForm(@Param('token') token: string) {
    return this.service.getFormByToken(token);
  }

  @Post(':token/draft')
  saveDraft(@Param('token') token: string, @Body() dto: SaveDraftDto) {
    return this.service.saveDraft(token, dto.answers, dto.filled_by || 'USER');
  }

  @Post(':token/submit')
  submit(@Param('token') token: string, @Body() dto: SubmitDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || '';
    const ua = req.headers['user-agent'] || '';
    return this.service.submit(token, dto.answers, dto.filled_by, dto.consent_confirmed, ip, ua);
  }
}

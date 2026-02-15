import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import {
  IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsNumber, IsArray, IsEnum, Min, Max,
} from 'class-validator';

// ============= DTOs =============
class CreateAgentDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() emp_id?: string;
}

class UpdateAgentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() emp_id?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsString() password?: string;
}

class CreateProviderDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() code!: string;
  @IsOptional() @IsEmail() contact_email?: string;
  @IsOptional() @IsString() contact_phone?: string;
}

class UpdateProviderDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsEmail() contact_email?: string;
  @IsOptional() @IsString() contact_phone?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

class CreateCompartmentDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() order?: number;
  @IsOptional() @IsString() question_range?: string;
}

class UpdateCompartmentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() order?: number;
  @IsOptional() @IsString() question_range?: string;
}

class CreateQuestionDto {
  @IsString() @IsNotEmpty() question_text!: string;
  @IsEnum(['YES_NO', 'MCQ', 'TEXT', 'NUMBER', 'REFLEXIVE', 'PARAGRAPH', 'CHECKBOX']) question_type!: string;
  @IsOptional() @IsArray() options?: string[];
  @IsString() @IsNotEmpty() compartment_id!: string;
  @IsNumber() @Min(1) @Max(10) risk_weight!: number;
  @IsArray() applicable_providers!: string[];
  @IsOptional() @IsNumber() order?: number;
}

class UpdateQuestionDto {
  @IsOptional() @IsString() question_text?: string;
  @IsOptional() @IsEnum(['YES_NO', 'MCQ', 'TEXT', 'NUMBER', 'REFLEXIVE', 'PARAGRAPH', 'CHECKBOX']) question_type?: string;
  @IsOptional() @IsArray() options?: string[];
  @IsOptional() @IsString() compartment_id?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(10) risk_weight?: number;
  @IsOptional() @IsArray() applicable_providers?: string[];
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsNumber() order?: number;
}

class CreateAssessmentDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() question_ids!: string[];
}

class UpdateAssessmentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(['DRAFT', 'ACTIVE', 'CLOSED']) status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
}

class CreateAssessmentLinkDto {
  @IsString() @IsNotEmpty() assessment_id!: string;
  @IsString() @IsNotEmpty() customer_id!: string;
  @IsString() @IsNotEmpty() insurance_provider_id!: string;
  @IsOptional() @IsString() agent_id?: string;
}

// ============= CONTROLLER =============
// Admin CANNOT create customers — only Agents can
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() { return this.adminService.getDashboardStats(); }

  // Agents
  @Get('agents')
  getAgents() { return this.adminService.getAgents(); }

  @Post('agents')
  createAgent(@Body() dto: CreateAgentDto) { return this.adminService.createAgent(dto); }

  @Put('agents/:id')
  updateAgent(@Param('id') id: string, @Body() dto: UpdateAgentDto) { return this.adminService.updateAgent(id, dto); }

  @Delete('agents/:id')
  deleteAgent(@Param('id') id: string) { return this.adminService.deleteAgent(id); }

  // Customers (VIEW ONLY — Admin cannot create customers)
  @Get('customers')
  getCustomers() { return this.adminService.getCustomers(); }

  // Insurance Providers
  @Get('providers')
  getProviders() { return this.adminService.getProviders(); }

  @Post('providers')
  createProvider(@Body() dto: CreateProviderDto) { return this.adminService.createProvider(dto); }

  @Put('providers/:id')
  updateProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) { return this.adminService.updateProvider(id, dto); }

  @Delete('providers/:id')
  deleteProvider(@Param('id') id: string) { return this.adminService.deleteProvider(id); }

  // Compartments
  @Get('compartments')
  getCompartments() { return this.adminService.getCompartments(); }

  @Post('compartments')
  createCompartment(@Body() dto: CreateCompartmentDto) { return this.adminService.createCompartment(dto); }

  @Put('compartments/:id')
  updateCompartment(@Param('id') id: string, @Body() dto: UpdateCompartmentDto) { return this.adminService.updateCompartment(id, dto); }

  @Delete('compartments/:id')
  deleteCompartment(@Param('id') id: string) { return this.adminService.deleteCompartment(id); }

  // Questions
  @Get('questions')
  getQuestions(@Query() query: any) { return this.adminService.getQuestions(query); }

  @Post('questions')
  createQuestion(@Body() dto: CreateQuestionDto) { return this.adminService.createQuestion(dto as any); }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) { return this.adminService.updateQuestion(id, dto as any); }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) { return this.adminService.deleteQuestion(id); }

  @Post('questions/bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  bulkUpload(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.bulkUploadQuestions(file.buffer, file.originalname);
  }

  // Assessments
  @Get('assessments')
  getAssessments() { return this.adminService.getAssessments(); }

  @Post('assessments')
  createAssessment(@Body() dto: CreateAssessmentDto) { return this.adminService.createAssessment(dto); }

  @Put('assessments/:id')
  updateAssessment(@Param('id') id: string, @Body() dto: UpdateAssessmentDto) { return this.adminService.updateAssessment(id, dto); }

  // Assessment Links
  @Get('assessment-links')
  getLinks(@Query() query: any) { return this.adminService.getAssessmentLinks(query); }

  @Post('assessment-links')
  createLink(@Body() dto: CreateAssessmentLinkDto) { return this.adminService.createAssessmentLink(dto); }

  // Responses
  @Get('responses')
  getAllResponses(@Query() query: any) { return this.adminService.getAllResponses(query); }

  @Get('responses/:linkId')
  getResponse(@Param('linkId') linkId: string) { return this.adminService.getResponse(linkId); }

  @Get('responses/:linkId/export')
  async exportResponse(@Param('linkId') linkId: string, @Query('format') format: 'excel' | 'pdf', @Res() res: Response) {
    const buffer = await this.adminService.exportResponses(linkId, format);
    if (format === 'excel') {
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename=response-${linkId}.xlsx` });
    } else {
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=response-${linkId}.pdf` });
    }
    res.send(buffer);
  }

  // Audit Logs
  @Get('audit-logs')
  getAuditLogs(@Query() query: any) { return this.adminService.getAuditLogs(query); }
}

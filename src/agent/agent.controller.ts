import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AgentService } from './agent.service';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

class CreateCustomerDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() company_name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() industry?: string;
}

@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('AGENT')
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.agentService.getDashboardStats(req.user.sub);
  }

  @Get('assessment-links')
  getLinks(@Request() req: any) {
    return this.agentService.getAssignedLinks(req.user.sub);
  }

  @Get('customers')
  getCustomers(@Request() req: any) {
    return this.agentService.getAssignedCustomers(req.user.sub);
  }

  @Post('customers')
  createCustomer(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.agentService.createCustomer(req.user.sub, dto);
  }

  @Post('assessment-links/:id/resend')
  resendLink(@Request() req: any, @Param('id') id: string) {
    return this.agentService.resendLink(req.user.sub, id);
  }

  @Get('responses/:linkId')
  getResponse(@Request() req: any, @Param('linkId') linkId: string) {
    return this.agentService.getResponseForLink(req.user.sub, linkId);
  }
}

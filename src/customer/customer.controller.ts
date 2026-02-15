import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomerService } from './customer.service';

@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.customerService.getDashboard(req.user.sub);
  }
}

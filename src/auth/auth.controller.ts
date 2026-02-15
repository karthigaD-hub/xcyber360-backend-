import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail() email!: string;
  @IsNotEmpty() @IsString() password!: string;
}

class AdminRegisterDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

class ChangePasswordDto {
  @IsString() @IsNotEmpty() current_password!: string;
  @IsString() @MinLength(8) new_password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin-register')
  async adminRegister(@Body() dto: AdminRegisterDto) {
    return this.authService.adminRegister(dto.name, dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return this.authService.me(req.user.sub, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, req.user.role, dto.current_password, dto.new_password);
  }
}

import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async adminRegister(name: string, email: string, password: string) {
    const existingAdmin = await this.prisma.admin.count();
    if (existingAdmin > 0) throw new ForbiddenException('Admin already exists. Registration not allowed.');

    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    const hashed = await this.hashPassword(password);
    const admin = await this.prisma.admin.create({
      data: { name, email, password: hashed, must_change_password: false },
    });

    const payload: JwtPayload = { sub: admin.id, email: admin.email, role: 'ADMIN' };
    return {
      user: {
        id: admin.id, email: admin.email, name: admin.name,
        role: 'ADMIN' as const, must_change_password: false,
      },
      token: this.jwtService.sign(payload),
    };
  }

  async login(email: string, password: string) {
    // Try admin
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (admin) {
      if (!admin.is_active) throw new UnauthorizedException('Account deactivated');
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
      const payload: JwtPayload = { sub: admin.id, email: admin.email, role: 'ADMIN' };
      return {
        user: {
          id: admin.id, email: admin.email, name: admin.name,
          role: 'ADMIN' as const, must_change_password: admin.must_change_password,
        },
        token: this.jwtService.sign(payload),
      };
    }

    // Try agent
    const agent = await this.prisma.agent.findUnique({ where: { email } });
    if (agent) {
      if (!agent.is_active) throw new UnauthorizedException('Account deactivated');
      // Check account lock
      if (agent.account_locked_until && agent.account_locked_until > new Date()) {
        throw new UnauthorizedException('Account locked. Try again later.');
      }
      const valid = await bcrypt.compare(password, agent.password);
      if (!valid) {
        const attempts = agent.failed_login_attempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
        await this.prisma.agent.update({
          where: { id: agent.id },
          data: { failed_login_attempts: attempts, account_locked_until: lockUntil },
        });
        throw new UnauthorizedException('Invalid credentials');
      }
      // Reset failed attempts on success
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { failed_login_attempts: 0, account_locked_until: null },
      });
      const payload: JwtPayload = { sub: agent.id, email: agent.email, role: 'AGENT' };
      return {
        user: {
          id: agent.id, email: agent.email, name: agent.name,
          role: 'AGENT' as const, must_change_password: agent.must_change_password,
        },
        token: this.jwtService.sign(payload),
      };
    }

    // Try customer
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (customer) {
      if (!customer.is_active) throw new UnauthorizedException('Account deactivated');
      if (customer.account_locked_until && customer.account_locked_until > new Date()) {
        throw new UnauthorizedException('Account locked. Try again later.');
      }
      const valid = await bcrypt.compare(password, customer.password);
      if (!valid) {
        const attempts = customer.failed_login_attempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { failed_login_attempts: attempts, account_locked_until: lockUntil },
        });
        throw new UnauthorizedException('Invalid credentials');
      }
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { failed_login_attempts: 0, account_locked_until: null },
      });
      const payload: JwtPayload = { sub: customer.id, email: customer.email, role: 'CUSTOMER' };
      return {
        user: {
          id: customer.id, email: customer.email, name: customer.name,
          role: 'CUSTOMER' as const, must_change_password: customer.must_change_password,
        },
        token: this.jwtService.sign(payload),
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async changePassword(userId: string, role: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    if (role === 'ADMIN') {
      const admin = await this.prisma.admin.findUnique({ where: { id: userId } });
      if (!admin) throw new UnauthorizedException();
      const valid = await bcrypt.compare(currentPassword, admin.password);
      if (!valid) throw new BadRequestException('Current password is incorrect');
      const hashed = await this.hashPassword(newPassword);
      await this.prisma.admin.update({ where: { id: userId }, data: { password: hashed, must_change_password: false } });
    } else if (role === 'AGENT') {
      const agent = await this.prisma.agent.findUnique({ where: { id: userId } });
      if (!agent) throw new UnauthorizedException();
      const valid = await bcrypt.compare(currentPassword, agent.password);
      if (!valid) throw new BadRequestException('Current password is incorrect');
      const hashed = await this.hashPassword(newPassword);
      await this.prisma.agent.update({ where: { id: userId }, data: { password: hashed, must_change_password: false } });
    } else if (role === 'CUSTOMER') {
      const customer = await this.prisma.customer.findUnique({ where: { id: userId } });
      if (!customer) throw new UnauthorizedException();
      const valid = await bcrypt.compare(currentPassword, customer.password);
      if (!valid) throw new BadRequestException('Current password is incorrect');
      const hashed = await this.hashPassword(newPassword);
      await this.prisma.customer.update({ where: { id: userId }, data: { password: hashed, must_change_password: false } });
    }

    return { message: 'Password changed successfully' };
  }

  async me(userId: string, role: string) {
    if (role === 'ADMIN') {
      const admin = await this.prisma.admin.findUnique({ where: { id: userId } });
      if (!admin) throw new UnauthorizedException();
      return {
        user: { id: admin.id, email: admin.email, name: admin.name, role: 'ADMIN' as const, must_change_password: admin.must_change_password },
        token: '',
      };
    }
    if (role === 'AGENT') {
      const agent = await this.prisma.agent.findUnique({ where: { id: userId } });
      if (!agent) throw new UnauthorizedException();
      return {
        user: { id: agent.id, email: agent.email, name: agent.name, role: 'AGENT' as const, must_change_password: agent.must_change_password },
        token: '',
      };
    }
    if (role === 'CUSTOMER') {
      const customer = await this.prisma.customer.findUnique({ where: { id: userId } });
      if (!customer) throw new UnauthorizedException();
      return {
        user: { id: customer.id, email: customer.email, name: customer.name, role: 'CUSTOMER' as const, must_change_password: customer.must_change_password },
        token: '',
      };
    }
    throw new UnauthorizedException();
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }
}

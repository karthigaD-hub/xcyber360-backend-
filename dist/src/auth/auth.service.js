"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async adminRegister(name, email, password) {
        const existingAdmin = await this.prisma.admin.count();
        if (existingAdmin > 0)
            throw new common_1.ForbiddenException('Admin already exists. Registration not allowed.');
        if (password.length < 8)
            throw new common_1.BadRequestException('Password must be at least 8 characters');
        const hashed = await this.hashPassword(password);
        const admin = await this.prisma.admin.create({
            data: { name, email, password: hashed, must_change_password: false },
        });
        const payload = { sub: admin.id, email: admin.email, role: 'ADMIN' };
        return {
            user: {
                id: admin.id, email: admin.email, name: admin.name,
                role: 'ADMIN', must_change_password: false,
            },
            token: this.jwtService.sign(payload),
        };
    }
    async login(email, password) {
        const admin = await this.prisma.admin.findUnique({ where: { email } });
        if (admin) {
            if (!admin.is_active)
                throw new common_1.UnauthorizedException('Account deactivated');
            const valid = await bcrypt.compare(password, admin.password);
            if (!valid)
                throw new common_1.UnauthorizedException('Invalid credentials');
            const payload = { sub: admin.id, email: admin.email, role: 'ADMIN' };
            return {
                user: {
                    id: admin.id, email: admin.email, name: admin.name,
                    role: 'ADMIN', must_change_password: admin.must_change_password,
                },
                token: this.jwtService.sign(payload),
            };
        }
        const agent = await this.prisma.agent.findUnique({ where: { email } });
        if (agent) {
            if (!agent.is_active)
                throw new common_1.UnauthorizedException('Account deactivated');
            if (agent.account_locked_until && agent.account_locked_until > new Date()) {
                throw new common_1.UnauthorizedException('Account locked. Try again later.');
            }
            const valid = await bcrypt.compare(password, agent.password);
            if (!valid) {
                const attempts = agent.failed_login_attempts + 1;
                const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
                await this.prisma.agent.update({
                    where: { id: agent.id },
                    data: { failed_login_attempts: attempts, account_locked_until: lockUntil },
                });
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            await this.prisma.agent.update({
                where: { id: agent.id },
                data: { failed_login_attempts: 0, account_locked_until: null },
            });
            const payload = { sub: agent.id, email: agent.email, role: 'AGENT' };
            return {
                user: {
                    id: agent.id, email: agent.email, name: agent.name,
                    role: 'AGENT', must_change_password: agent.must_change_password,
                },
                token: this.jwtService.sign(payload),
            };
        }
        const customer = await this.prisma.customer.findUnique({ where: { email } });
        if (customer) {
            if (!customer.is_active)
                throw new common_1.UnauthorizedException('Account deactivated');
            if (customer.account_locked_until && customer.account_locked_until > new Date()) {
                throw new common_1.UnauthorizedException('Account locked. Try again later.');
            }
            const valid = await bcrypt.compare(password, customer.password);
            if (!valid) {
                const attempts = customer.failed_login_attempts + 1;
                const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
                await this.prisma.customer.update({
                    where: { id: customer.id },
                    data: { failed_login_attempts: attempts, account_locked_until: lockUntil },
                });
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            await this.prisma.customer.update({
                where: { id: customer.id },
                data: { failed_login_attempts: 0, account_locked_until: null },
            });
            const payload = { sub: customer.id, email: customer.email, role: 'CUSTOMER' };
            return {
                user: {
                    id: customer.id, email: customer.email, name: customer.name,
                    role: 'CUSTOMER', must_change_password: customer.must_change_password,
                },
                token: this.jwtService.sign(payload),
            };
        }
        throw new common_1.UnauthorizedException('Invalid credentials');
    }
    async changePassword(userId, role, currentPassword, newPassword) {
        if (newPassword.length < 8)
            throw new common_1.BadRequestException('Password must be at least 8 characters');
        if (role === 'ADMIN') {
            const admin = await this.prisma.admin.findUnique({ where: { id: userId } });
            if (!admin)
                throw new common_1.UnauthorizedException();
            const valid = await bcrypt.compare(currentPassword, admin.password);
            if (!valid)
                throw new common_1.BadRequestException('Current password is incorrect');
            const hashed = await this.hashPassword(newPassword);
            await this.prisma.admin.update({ where: { id: userId }, data: { password: hashed, must_change_password: false } });
        }
        else if (role === 'AGENT') {
            const agent = await this.prisma.agent.findUnique({ where: { id: userId } });
            if (!agent)
                throw new common_1.UnauthorizedException();
            const valid = await bcrypt.compare(currentPassword, agent.password);
            if (!valid)
                throw new common_1.BadRequestException('Current password is incorrect');
            const hashed = await this.hashPassword(newPassword);
            await this.prisma.agent.update({ where: { id: userId }, data: { password: hashed, must_change_password: false } });
        }
        else if (role === 'CUSTOMER') {
            const customer = await this.prisma.customer.findUnique({ where: { id: userId } });
            if (!customer)
                throw new common_1.UnauthorizedException();
            const valid = await bcrypt.compare(currentPassword, customer.password);
            if (!valid)
                throw new common_1.BadRequestException('Current password is incorrect');
            const hashed = await this.hashPassword(newPassword);
            await this.prisma.customer.update({ where: { id: userId }, data: { password: hashed, must_change_password: false } });
        }
        return { message: 'Password changed successfully' };
    }
    async me(userId, role) {
        if (role === 'ADMIN') {
            const admin = await this.prisma.admin.findUnique({ where: { id: userId } });
            if (!admin)
                throw new common_1.UnauthorizedException();
            return {
                user: { id: admin.id, email: admin.email, name: admin.name, role: 'ADMIN', must_change_password: admin.must_change_password },
                token: '',
            };
        }
        if (role === 'AGENT') {
            const agent = await this.prisma.agent.findUnique({ where: { id: userId } });
            if (!agent)
                throw new common_1.UnauthorizedException();
            return {
                user: { id: agent.id, email: agent.email, name: agent.name, role: 'AGENT', must_change_password: agent.must_change_password },
                token: '',
            };
        }
        if (role === 'CUSTOMER') {
            const customer = await this.prisma.customer.findUnique({ where: { id: userId } });
            if (!customer)
                throw new common_1.UnauthorizedException();
            return {
                user: { id: customer.id, email: customer.email, name: customer.name, role: 'CUSTOMER', must_change_password: customer.must_change_password },
                token: '',
            };
        }
        throw new common_1.UnauthorizedException();
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 12);
    }
    generateTempPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
        let pwd = '';
        for (let i = 0; i < 12; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pwd;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
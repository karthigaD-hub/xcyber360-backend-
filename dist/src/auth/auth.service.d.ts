import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    email: string;
    role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
}
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    adminRegister(name: string, email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN";
            must_change_password: boolean;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN";
            must_change_password: boolean;
        };
        token: string;
    } | {
        user: {
            id: string;
            email: string;
            name: string;
            role: "AGENT";
            must_change_password: boolean;
        };
        token: string;
    } | {
        user: {
            id: string;
            email: string;
            name: string;
            role: "CUSTOMER";
            must_change_password: boolean;
        };
        token: string;
    }>;
    changePassword(userId: string, role: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    me(userId: string, role: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN";
            must_change_password: boolean;
        };
        token: string;
    } | {
        user: {
            id: string;
            email: string;
            name: string;
            role: "AGENT";
            must_change_password: boolean;
        };
        token: string;
    } | {
        user: {
            id: string;
            email: string;
            name: string;
            role: "CUSTOMER";
            must_change_password: boolean;
        };
        token: string;
    }>;
    hashPassword(password: string): Promise<string>;
    generateTempPassword(): string;
}

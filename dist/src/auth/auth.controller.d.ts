import { AuthService } from './auth.service';
declare class LoginDto {
    email: string;
    password: string;
}
declare class AdminRegisterDto {
    name: string;
    email: string;
    password: string;
}
declare class ChangePasswordDto {
    current_password: string;
    new_password: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    adminRegister(dto: AdminRegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN";
            must_change_password: boolean;
        };
        token: string;
    }>;
    login(dto: LoginDto): Promise<{
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
    logout(): Promise<{
        message: string;
    }>;
    me(req: any): Promise<{
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
    changePassword(req: any, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
export {};

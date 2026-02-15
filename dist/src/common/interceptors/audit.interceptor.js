"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditInterceptor = class AuditInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
            return next.handle();
        }
        const user = req.user;
        const path = req.route?.path || req.url;
        const ip = req.ip || req.headers['x-forwarded-for'] || '';
        const ua = req.headers['user-agent'] || '';
        return next.handle().pipe((0, rxjs_1.tap)(async (responseData) => {
            try {
                const segments = req.url.split('/').filter(Boolean);
                const entityType = this.resolveEntityType(segments);
                const entityId = req.params?.id || responseData?.data?.id || 'unknown';
                const action = this.resolveAction(method, path);
                await this.prisma.auditLog.create({
                    data: {
                        action,
                        entity_type: entityType,
                        entity_id: String(entityId),
                        performed_by: user?.sub || 'anonymous',
                        performer_role: user?.role || 'USER',
                        details: JSON.stringify({ method, path: req.url, body: this.sanitizeBody(req.body) }),
                        ip_address: String(ip),
                        user_agent: String(ua),
                    },
                });
            }
            catch {
            }
        }));
    }
    resolveEntityType(segments) {
        const map = {
            agents: 'AGENT',
            customers: 'CUSTOMER',
            providers: 'INSURANCE_PROVIDER',
            compartments: 'COMPARTMENT',
            questions: 'QUESTION',
            assessments: 'ASSESSMENT',
            'assessment-links': 'ASSESSMENT_LINK',
            responses: 'RESPONSE',
            auth: 'AUTH',
        };
        for (const seg of segments) {
            if (map[seg])
                return map[seg];
        }
        return 'UNKNOWN';
    }
    resolveAction(method, path) {
        const map = {
            POST: 'CREATE',
            PUT: 'UPDATE',
            PATCH: 'UPDATE',
            DELETE: 'DELETE',
        };
        if (path.includes('login'))
            return 'LOGIN';
        if (path.includes('logout'))
            return 'LOGOUT';
        if (path.includes('submit'))
            return 'SUBMIT';
        if (path.includes('draft'))
            return 'SAVE_DRAFT';
        if (path.includes('bulk-upload'))
            return 'BULK_UPLOAD';
        if (path.includes('resend'))
            return 'RESEND_LINK';
        return map[method] || method;
    }
    sanitizeBody(body) {
        if (!body)
            return {};
        const sanitized = { ...body };
        delete sanitized.password;
        delete sanitized.token;
        return sanitized;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map
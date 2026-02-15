import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Only audit mutating operations
    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return next.handle();
    }

    const user = req.user;
    const path = req.route?.path || req.url;
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    const ua = req.headers['user-agent'] || '';

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          // Determine entity from path
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
        } catch {
          // Audit logging should never break the request
        }
      }),
    );
  }

  private resolveEntityType(segments: string[]): string {
    // /api/admin/agents -> AGENT
    const map: Record<string, string> = {
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
      if (map[seg]) return map[seg];
    }
    return 'UNKNOWN';
  }

  private resolveAction(method: string, path: string): string {
    const map: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    if (path.includes('login')) return 'LOGIN';
    if (path.includes('logout')) return 'LOGOUT';
    if (path.includes('submit')) return 'SUBMIT';
    if (path.includes('draft')) return 'SAVE_DRAFT';
    if (path.includes('bulk-upload')) return 'BULK_UPLOAD';
    if (path.includes('resend')) return 'RESEND_LINK';
    return map[method] || method;
  }

  private sanitizeBody(body: any): any {
    if (!body) return {};
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }
}

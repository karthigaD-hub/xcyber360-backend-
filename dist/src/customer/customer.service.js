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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let CustomerService = class CustomerService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async getDashboard(customerId) {
        const links = await this.prisma.assessmentLink.findMany({
            where: { customer_id: customerId },
            orderBy: { created_at: 'desc' },
            include: {
                assessment: { select: { name: true } },
                insurance_provider: { select: { name: true } },
                agent: { select: { name: true } },
            },
        });
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        return {
            data: {
                total_links: links.length,
                yet_to_start: links.filter(l => l.status === 'YET_TO_START').length,
                in_progress: links.filter(l => l.status === 'IN_PROGRESS').length,
                submitted: links.filter(l => l.status === 'SUBMITTED').length,
                links: links.map(l => ({
                    id: l.id,
                    assessment_name: l.assessment.name,
                    insurance_provider_name: l.insurance_provider.name,
                    agent_name: l.agent?.name || null,
                    token: l.token,
                    link_url: `${frontendUrl}/assess/${l.token}`,
                    status: l.status,
                    progress_percent: l.progress_percent,
                    submitted_at: l.submitted_at?.toISOString() || null,
                    created_at: l.created_at.toISOString(),
                })),
            },
        };
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], CustomerService);
//# sourceMappingURL=customer.service.js.map
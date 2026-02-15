import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getDashboard(customerId: string) {
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
}

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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding X-Cyber360 database...');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
    const admin = await prisma.admin.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'admin@xcyber360.com' },
        update: {},
        create: {
            name: process.env.ADMIN_NAME || 'System Admin',
            email: process.env.ADMIN_EMAIL || 'admin@xcyber360.com',
            password: adminPassword,
            must_change_password: false,
        },
    });
    console.log(`✅ Admin created: ${admin.email}`);
    const agentPassword = await bcrypt.hash('Agent@123', 12);
    const agent = await prisma.agent.upsert({
        where: { email: 'agent@xcyber360.com' },
        update: {},
        create: {
            name: 'John Agent',
            email: 'agent@xcyber360.com',
            password: agentPassword,
            phone: '+1234567890',
            designation: 'Senior Broker',
            emp_id: 'EMP-001',
            must_change_password: false,
        },
    });
    console.log(`✅ Agent created: ${agent.email}`);
    const customerPassword = await bcrypt.hash('Customer@123', 12);
    const customer = await prisma.customer.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
            name: 'Acme Corp',
            company_name: 'Acme Corporation',
            email: 'customer@example.com',
            industry: 'Technology',
            agent_id: agent.id,
            password: customerPassword,
            must_change_password: false,
        },
    });
    console.log(`✅ Customer created: ${customer.email}`);
    const providers = await Promise.all([
        prisma.insuranceProvider.upsert({
            where: { code: 'CONSOLIDATION' },
            update: {},
            create: { name: 'Consolidation', code: 'CONSOLIDATION', contact_email: null },
        }),
        prisma.insuranceProvider.upsert({
            where: { code: 'PROV-A' },
            update: {},
            create: { name: 'Alpha Insurance', code: 'PROV-A', contact_email: 'contact@alpha.com' },
        }),
        prisma.insuranceProvider.upsert({
            where: { code: 'PROV-B' },
            update: {},
            create: { name: 'Beta Insurance', code: 'PROV-B', contact_email: 'contact@beta.com' },
        }),
    ]);
    console.log(`✅ ${providers.length} Insurance Providers created (including Consolidation)`);
    const compartments = await Promise.all([
        prisma.compartment.upsert({
            where: { name: 'Vulnerability Management' },
            update: {},
            create: { name: 'Vulnerability Management', description: 'Assess vulnerability scanning and patching practices', order: 1, question_range: '1-5' },
        }),
        prisma.compartment.upsert({
            where: { name: 'Network Security' },
            update: {},
            create: { name: 'Network Security', description: 'Evaluate network architecture and controls', order: 2, question_range: '6-10' },
        }),
        prisma.compartment.upsert({
            where: { name: 'Compliance' },
            update: {},
            create: { name: 'Compliance', description: 'Regulatory and standards compliance', order: 3, question_range: '11-15' },
        }),
        prisma.compartment.upsert({
            where: { name: 'Incident History' },
            update: {},
            create: { name: 'Incident History', description: 'Past security incidents and response', order: 4, question_range: '16-20' },
        }),
    ]);
    console.log(`✅ ${compartments.length} Compartments created`);
    const questions = await Promise.all([
        prisma.question.create({
            data: {
                question_text: 'Do you have a vulnerability scanning program in place?',
                question_type: 'YES_NO', compartment_id: compartments[0].id,
                risk_weight: 8, order: 1,
                applicable_providers: {
                    create: [{ insurance_provider_id: providers[1].id }, { insurance_provider_id: providers[2].id }],
                },
            },
        }),
        prisma.question.create({
            data: {
                question_text: 'How often are vulnerability scans performed?',
                question_type: 'MCQ', options: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
                compartment_id: compartments[0].id, risk_weight: 7, order: 2,
                applicable_providers: { create: [{ insurance_provider_id: providers[1].id }] },
            },
        }),
        prisma.question.create({
            data: {
                question_text: 'Is your network segmented?',
                question_type: 'YES_NO', compartment_id: compartments[1].id,
                risk_weight: 9, order: 6,
                applicable_providers: {
                    create: [{ insurance_provider_id: providers[1].id }, { insurance_provider_id: providers[2].id }],
                },
            },
        }),
        prisma.question.create({
            data: {
                question_text: 'Describe your firewall configuration.',
                question_type: 'TEXT', compartment_id: compartments[1].id,
                risk_weight: 6, order: 7,
                applicable_providers: { create: [{ insurance_provider_id: providers[2].id }] },
            },
        }),
        prisma.question.create({
            data: {
                question_text: 'How many security incidents occurred in the last 12 months?',
                question_type: 'NUMBER', compartment_id: compartments[3].id,
                risk_weight: 8, order: 16,
                applicable_providers: {
                    create: [{ insurance_provider_id: providers[1].id }, { insurance_provider_id: providers[2].id }],
                },
            },
        }),
    ]);
    console.log(`✅ ${questions.length} Questions created`);
    const assessment = await prisma.assessment.create({
        data: {
            name: 'Cyber Risk Assessment 2025',
            description: 'Comprehensive cyber security risk evaluation',
            status: 'ACTIVE',
            assessment_questions: {
                create: questions.map((q, i) => ({ question_id: q.id, order: i + 1 })),
            },
        },
    });
    console.log(`✅ Assessment created: ${assessment.name}`);
    const link = await prisma.assessmentLink.create({
        data: {
            assessment_id: assessment.id,
            customer_id: customer.id,
            insurance_provider_id: providers[1].id,
            agent_id: agent.id,
        },
    });
    console.log(`✅ Assessment Link created: /assess/${link.token}`);
    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Login credentials:');
    console.log(`   Admin:    ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log(`   Agent:    ${agent.email} / Agent@123`);
    console.log(`   Customer: ${customer.email} / Customer@123`);
    console.log(`   Assessment Link: /assess/${link.token}`);
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
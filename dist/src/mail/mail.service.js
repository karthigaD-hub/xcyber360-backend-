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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        const host = this.config.get('SMTP_HOST', '');
        const port = this.config.get('SMTP_PORT', '587');
        const user = this.config.get('SMTP_USER', '');
        const pass = this.config.get('SMTP_PASS', '');
        if (host && user) {
            this.transporter = nodemailer.createTransport({
                host,
                port: parseInt(port, 10),
                secure: parseInt(port, 10) === 465,
                auth: { user, pass },
            });
            this.logger.log('SMTP configured successfully');
        }
        else {
            this.logger.warn('SMTP not configured — emails will be logged to console only');
        }
    }
    async sendLoginCredentials(to, name, role, tempPassword) {
        const subject = `X-Cyber360 — Your ${role} Account Has Been Created`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0066cc;">Welcome to X-Cyber360</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your ${role} account has been created. Use the following credentials to login:</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color: #cc0000;"><strong>⚠️ Please change your password on first login.</strong></p>
        <p>Regards,<br/>X-Cyber360 Security Platform</p>
      </div>
    `;
        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: this.config.get('SMTP_FROM', 'noreply@xcyber360.com'),
                    to,
                    subject,
                    html,
                });
                this.logger.log(`Email sent to ${to}`);
            }
            catch (err) {
                this.logger.error(`Failed to send email to ${to}: ${err.message}`);
            }
        }
        else {
            this.logger.log(`[EMAIL LOG] To: ${to} | Subject: ${subject} | Password: ${tempPassword}`);
        }
    }
    async sendAssessmentLink(to, customerName, assessmentName, linkUrl) {
        const subject = `X-Cyber360 — Cyber Security Assessment: ${assessmentName}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0066cc;">Cyber Security Assessment</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>You have been invited to complete a cyber security risk assessment.</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Assessment:</strong> ${assessmentName}</p>
          <p style="margin: 4px 0;"><strong>Link:</strong> <a href="${linkUrl}">${linkUrl}</a></p>
        </div>
        <p>This link is unique to you. Do not share it with others.</p>
        <p>Regards,<br/>X-Cyber360 Security Platform</p>
      </div>
    `;
        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: this.config.get('SMTP_FROM', 'noreply@xcyber360.com'),
                    to,
                    subject,
                    html,
                });
                this.logger.log(`Assessment link email sent to ${to}`);
            }
            catch (err) {
                this.logger.error(`Failed to send email to ${to}: ${err.message}`);
            }
        }
        else {
            this.logger.log(`[EMAIL LOG] To: ${to} | Subject: ${subject} | Link: ${linkUrl}`);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map
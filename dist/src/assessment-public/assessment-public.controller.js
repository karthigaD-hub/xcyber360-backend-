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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentPublicController = void 0;
const common_1 = require("@nestjs/common");
const assessment_public_service_1 = require("./assessment-public.service");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AnswerDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AnswerDto.prototype, "question_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], AnswerDto.prototype, "answer", void 0);
class SaveDraftDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnswerDto),
    __metadata("design:type", Array)
], SaveDraftDto.prototype, "answers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['USER', 'AGENT']),
    __metadata("design:type", String)
], SaveDraftDto.prototype, "filled_by", void 0);
class SubmitDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnswerDto),
    __metadata("design:type", Array)
], SubmitDto.prototype, "answers", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['USER', 'AGENT']),
    __metadata("design:type", String)
], SubmitDto.prototype, "filled_by", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitDto.prototype, "consent_confirmed", void 0);
let AssessmentPublicController = class AssessmentPublicController {
    constructor(service) {
        this.service = service;
    }
    getForm(token) {
        return this.service.getFormByToken(token);
    }
    saveDraft(token, dto) {
        return this.service.saveDraft(token, dto.answers, dto.filled_by || 'USER');
    }
    submit(token, dto, req) {
        const ip = req.ip || req.headers['x-forwarded-for']?.toString() || '';
        const ua = req.headers['user-agent'] || '';
        return this.service.submit(token, dto.answers, dto.filled_by, dto.consent_confirmed, ip, ua);
    }
};
exports.AssessmentPublicController = AssessmentPublicController;
__decorate([
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssessmentPublicController.prototype, "getForm", null);
__decorate([
    (0, common_1.Post)(':token/draft'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SaveDraftDto]),
    __metadata("design:returntype", void 0)
], AssessmentPublicController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Post)(':token/submit'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SubmitDto, Object]),
    __metadata("design:returntype", void 0)
], AssessmentPublicController.prototype, "submit", null);
exports.AssessmentPublicController = AssessmentPublicController = __decorate([
    (0, common_1.Controller)('assessment'),
    __metadata("design:paramtypes", [assessment_public_service_1.AssessmentPublicService])
], AssessmentPublicController);
//# sourceMappingURL=assessment-public.controller.js.map
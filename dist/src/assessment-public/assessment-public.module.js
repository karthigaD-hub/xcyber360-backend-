"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentPublicModule = void 0;
const common_1 = require("@nestjs/common");
const assessment_public_controller_1 = require("./assessment-public.controller");
const assessment_public_service_1 = require("./assessment-public.service");
let AssessmentPublicModule = class AssessmentPublicModule {
};
exports.AssessmentPublicModule = AssessmentPublicModule;
exports.AssessmentPublicModule = AssessmentPublicModule = __decorate([
    (0, common_1.Module)({
        controllers: [assessment_public_controller_1.AssessmentPublicController],
        providers: [assessment_public_service_1.AssessmentPublicService],
    })
], AssessmentPublicModule);
//# sourceMappingURL=assessment-public.module.js.map
import { Module } from '@nestjs/common';
import { AssessmentPublicController } from './assessment-public.controller';
import { AssessmentPublicService } from './assessment-public.service';

@Module({
  controllers: [AssessmentPublicController],
  providers: [AssessmentPublicService],
})
export class AssessmentPublicModule {}

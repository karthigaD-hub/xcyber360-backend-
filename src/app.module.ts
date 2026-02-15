import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AgentModule } from './agent/agent.module';
import { CustomerModule } from './customer/customer.module';
import { AssessmentPublicModule } from './assessment-public/assessment-public.module';
import { MailModule } from './mail/mail.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AppController } from './app.controller';

@Module({
  imports: [
    
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    AuthModule,
    AdminModule,
    AgentModule,
    CustomerModule,
    AssessmentPublicModule,
  ],
  
  controllers: [AppController],  // 👈 ADD THIS

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApi() {
    return {
      name: 'xCyber360 API',
      status: 'running',
      version: '1.0.0'
    };
  }
}

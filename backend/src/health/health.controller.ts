import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'devboard-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

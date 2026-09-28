import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('status')
  getStatus() {
    return this.telemetryService.getStatus();
  }

  @Post('simulate')
  simulate(@Body() body: any) {
    const event = this.telemetryService.simulate(body);
    return {
      success: true,
      simulatedEvent: event,
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Headers() headers: Record<string, any>, @Body() body: any) {
    const event = this.telemetryService.processWebhook(headers, body);
    return {
      success: true,
      eventReceived: !!event,
      event,
    };
  }
}

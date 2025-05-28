import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('.ping')
  @ApiOperation({ summary: 'Ping' })
  @ApiResponse({ status: 200, description: 'Ping' })
  ping(): string {
    return this.appService.ping();
  }
}

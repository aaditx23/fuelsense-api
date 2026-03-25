import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @ApiOperation({ summary: 'Root Endpoint', description: 'API root endpoint with service information' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get()
  root() {
    return {
      message: 'FuelSense backend is running',
      version: 'v1',
    };
  }

  @ApiOperation({ summary: 'Health Check Endpoint', description: 'Simple health check endpoint for monitoring' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

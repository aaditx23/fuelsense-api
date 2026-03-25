import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { AuthUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CreateRefuelRecordUseCase } from '../application/use-cases/create-refuel-record.use-case';
import { GetRefuelRecordsUseCase } from '../application/use-cases/get-refuel-records.use-case';
import { CreateRefuelDto } from './dto/create-refuel.dto';

@ApiTags('refuel')
@ApiBearerAuth('HTTPBearer')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/refuel')
export class RefuelController {
  constructor(
    private readonly createRefuelRecordUseCase: CreateRefuelRecordUseCase,
    private readonly getRefuelRecordsUseCase: GetRefuelRecordsUseCase,
  ) {}

  @ApiOperation({ summary: 'Create Refuel Record', description: 'Create a new refuel record for the authenticated user.' })
  @ApiBody({ type: CreateRefuelDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @Post()
  createRecord(@CurrentUser() user: AuthUser, @Body() dto: CreateRefuelDto) {
    return this.createRefuelRecordUseCase.execute(user.userId, dto);
  }

  @ApiOperation({ summary: 'Get Refuel Records', description: 'Get all refuel records for the authenticated user.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get()
  getRecords(@CurrentUser() user: AuthUser) {
    return this.getRefuelRecordsUseCase.execute(user.userId);
  }
}

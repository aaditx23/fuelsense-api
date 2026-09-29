import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { CompleteRefuelRecordUseCase } from '../application/use-cases/complete-refuel-record.use-case';
import { CreateRefuelRecordUseCase } from '../application/use-cases/create-refuel-record.use-case';
import { DeleteRefuelRecordUseCase } from '../application/use-cases/delete-refuel-record.use-case';
import { GetRefuelRecordsUseCase } from '../application/use-cases/get-refuel-records.use-case';
import { CompleteRefuelDto } from './dto/complete-refuel.dto';
import { CreateRefuelDto } from './dto/create-refuel.dto';

@ApiTags('refuel')
@ApiBearerAuth('HTTPBearer')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/refuel')
export class RefuelController {
  constructor(
    private readonly createRefuelRecordUseCase: CreateRefuelRecordUseCase,
    private readonly getRefuelRecordsUseCase: GetRefuelRecordsUseCase,
    private readonly completeRefuelRecordUseCase: CompleteRefuelRecordUseCase,
    private readonly deleteRefuelRecordUseCase: DeleteRefuelRecordUseCase,
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

  @ApiOperation({ summary: 'Complete Reserve Entry', description: 'Complete an incomplete reserve entry with final readings and fuel data.' })
  @ApiBody({ type: CompleteRefuelDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @Patch(':id')
  completeRecord(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteRefuelDto,
  ) {
    return this.completeRefuelRecordUseCase.execute(user.userId, id, dto);
  }

  @ApiOperation({ summary: 'Delete Refuel Record', description: 'Delete one of the authenticated user\'s refuel records.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Delete(':id')
  deleteRecord(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deleteRefuelRecordUseCase.execute(user.userId, id);
  }
}

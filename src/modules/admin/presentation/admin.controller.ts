import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { ApproveBikeUseCase } from '../application/use-cases/approve-bike.use-case';
import { DeleteBikeUseCase } from '../application/use-cases/delete-bike.use-case';
import { EditBikeUseCase } from '../application/use-cases/edit-bike.use-case';
import { GetPendingBikesUseCase } from '../application/use-cases/get-pending-bikes.use-case';
import { RejectBikeUseCase } from '../application/use-cases/reject-bike.use-case';
import { EditBikeDto } from './dto/edit-bike.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('admin')
@ApiBearerAuth('HTTPBearer')
@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly getPendingBikesUseCase: GetPendingBikesUseCase,
    private readonly editBikeUseCase: EditBikeUseCase,
    private readonly approveBikeUseCase: ApproveBikeUseCase,
    private readonly rejectBikeUseCase: RejectBikeUseCase,
    private readonly deleteBikeUseCase: DeleteBikeUseCase,
  ) {}

  @ApiOperation({ summary: 'Get Pending Bikes', description: 'Get all pending bike submissions.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('bikes/pending')
  getPendingBikes() {
    return this.getPendingBikesUseCase.execute();
  }

  @ApiOperation({ summary: 'Edit Bike', description: 'Edit bike data for moderation.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: EditBikeDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @Put('bikes/:id/edit')
  editBikeLegacy(@Param('id', ParseIntPipe) bikeId: number, @Body() dto: EditBikeDto) {
    return this.editBikeUseCase.execute(bikeId, dto);
  }

  @ApiOperation({ summary: 'Approve Bike', description: 'Approve a pending bike.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Successful Response' })
  @Put('bikes/:id/approve')
  approveBikeLegacy(@Param('id', ParseIntPipe) bikeId: number) {
    return this.approveBikeUseCase.execute(bikeId);
  }

  @ApiOperation({ summary: 'Reject Bike', description: 'Reject a pending bike by deleting it.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Successful Response' })
  @Delete('bikes/:id/reject')
  rejectBikeLegacy(@Param('id', ParseIntPipe) bikeId: number) {
    return this.rejectBikeUseCase.execute(bikeId);
  }

  @ApiOperation({ summary: 'Delete Bike', description: 'Delete any bike from database.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Successful Response' })
  @Delete('bikes/:id')
  deleteBike(@Param('id', ParseIntPipe) bikeId: number) {
    return this.deleteBikeUseCase.execute(bikeId);
  }
}

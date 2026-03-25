import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
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
import { GetActiveBikesUseCase } from '../application/use-cases/get-active-bikes.use-case';
import { GetMyBikesUseCase } from '../application/use-cases/get-my-bikes.use-case';
import { RemoveMyBikeUseCase } from '../application/use-cases/remove-my-bike.use-case';
import { SelectBikeUseCase } from '../application/use-cases/select-bike.use-case';
import { SubmitBikeUseCase } from '../application/use-cases/submit-bike.use-case';
import { RemoveBikeDto } from './dto/remove-bike.dto';
import { SelectBikeDto } from './dto/select-bike.dto';
import { SubmitBikeDto } from './dto/submit-bike.dto';

@ApiTags('bikes')
@ApiBearerAuth('HTTPBearer')
@Controller('api/v1/bikes')
export class BikesController {
  constructor(
    private readonly getActiveBikesUseCase: GetActiveBikesUseCase,
    private readonly getMyBikesUseCase: GetMyBikesUseCase,
    private readonly submitBikeUseCase: SubmitBikeUseCase,
    private readonly selectBikeUseCase: SelectBikeUseCase,
    private readonly removeMyBikeUseCase: RemoveMyBikeUseCase,
  ) {}

  @ApiOperation({ summary: 'Get Bikes', description: 'Get all active approved bikes. Requires authentication.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Get()
  getActiveBikes() {
    return this.getActiveBikesUseCase.execute();
  }

  @ApiOperation({ summary: 'Get My Bikes', description: 'Get all bikes selected by the authenticated user.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Get('my-bikes')
  getMyBikes(@CurrentUser() user: AuthUser) {
    return this.getMyBikesUseCase.execute(user.userId);
  }

  @ApiOperation({ summary: 'Submit Bike For Approval', description: 'Submit a new bike for admin approval.' })
  @ApiBody({ type: SubmitBikeDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Post('submit')
  submitBike(@CurrentUser() user: AuthUser, @Body() dto: SubmitBikeDto) {
    return this.submitBikeUseCase.execute({
      ...dto,
      submittedById: user.userId,
    });
  }

  @ApiOperation({ summary: 'Select Bike', description: 'Associate a bike with the authenticated user profile.' })
  @ApiBody({ type: SelectBikeDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Put('select')
  selectBike(@CurrentUser() user: AuthUser, @Body() dto: SelectBikeDto) {
    return this.selectBikeUseCase.execute(user.userId, dto.bikeId);
  }

  @ApiOperation({ summary: 'Remove My Bike', description: 'Remove a bike from the authenticated user bike list.' })
  @ApiBody({ type: RemoveBikeDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Delete('my-bikes')
  removeBike(@CurrentUser() user: AuthUser, @Body() dto: RemoveBikeDto) {
    return this.removeMyBikeUseCase.execute(user.userId, dto.bikeId);
  }
}

import { Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { AuthUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { DeleteUserProfileUseCase } from '../application/use-cases/delete-user-profile.use-case';
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case';

@ApiTags('user')
@Controller('api/v1/user')
export class UserController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly deleteUserProfileUseCase: DeleteUserProfileUseCase,
  ) {}

  @ApiBearerAuth('HTTPBearer')
  @ApiOperation({ summary: 'Get User Profile', description: 'Get current user profile with selected bikes.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.getUserProfileUseCase.execute(user.userId);
  }

  @ApiOperation({ summary: 'Delete User Profile', description: 'Delete a user profile and all associated data.' })
  @ApiParam({ name: 'userId', type: Number, description: 'User id to delete' })
  @ApiOkResponse({ description: 'Successful Response' })
  @ApiBearerAuth('HTTPBearer')
  @UseGuards(JwtAuthGuard)
  @Delete('profile/:userId')
  deleteProfile(
    @CurrentUser() user: AuthUser,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const isSelf = user.userId === userId;
    const isAdmin = user.role === 'ADMIN';
    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only delete your own profile unless you are an admin');
    }

    return this.deleteUserProfileUseCase.execute(userId);
  }
}

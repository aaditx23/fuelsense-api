import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { AuthUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { DeleteUserProfileUseCase } from '../application/use-cases/delete-user-profile.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { DeleteOwnAccountUseCase } from '../application/use-cases/delete-own-account.use-case';
import { UpdateUserProfileUseCase } from '../application/use-cases/update-user-profile.use-case';
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('user')
@Controller('api/v1/user')
export class UserController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly deleteUserProfileUseCase: DeleteUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly deleteOwnAccountUseCase: DeleteOwnAccountUseCase,
  ) {}

  @ApiBearerAuth('HTTPBearer')
  @ApiOperation({ summary: 'Update My Profile', description: 'Change username, email and/or profile picture. Only sent fields change.' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.updateUserProfileUseCase.execute(user.userId, dto);
  }

  @ApiBearerAuth('HTTPBearer')
  @ApiOperation({ summary: 'Change My Password', description: 'Change the password after confirming the current one.' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Post('me/password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.changePasswordUseCase.execute(user.userId, dto);
  }

  @ApiBearerAuth('HTTPBearer')
  @ApiOperation({ summary: 'Delete My Account', description: 'Permanently delete the authenticated account and its data. Requires the current password.' })
  @ApiBody({ type: DeleteAccountDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  deleteMe(@CurrentUser() user: AuthUser, @Body() dto: DeleteAccountDto) {
    return this.deleteOwnAccountUseCase.execute(user.userId, dto.password);
  }

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

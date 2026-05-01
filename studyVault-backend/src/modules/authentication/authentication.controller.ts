import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthenticationService } from './authentication.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { CompleteRegistrationDto } from './dtos/complete-registration.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';

const REFRESH_TOKEN_COOKIE_NAME = 'studyvault_refresh_token';
const CSRF_TOKEN_COOKIE_NAME = 'studyvault_csrf_token';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
  };
};

@ApiTags('auth')
@ApiBearerAuth('bearer')
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  private getRequestContext(req: Request) {
    return {
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.get('user-agent'),
    };
  }

  private getRefreshToken(req: Request): string | undefined {
    return this.getCookie(req, REFRESH_TOKEN_COOKIE_NAME);
  }

  private getCsrfToken(req: Request): string | undefined {
    return req.get('x-csrf-token');
  }

  private requireCsrfToken(req: Request): string {
    const csrfToken = this.getCsrfToken(req);

    if (!csrfToken) {
      throw new UnauthorizedException('CSRF token is invalid or missing');
    }

    return csrfToken;
  }

  private getCookie(req: Request, cookieName: string): string | undefined {
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const refreshCookie = cookies.find((cookie) =>
      cookie.startsWith(`${cookieName}=`),
    );

    if (!refreshCookie) {
      return undefined;
    }

    return decodeURIComponent(refreshCookie.slice(`${cookieName}=`.length));
  }

  private setRefreshTokenCookie(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
  ) {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      expires: expiresAt,
      httpOnly: true,
      path: '/api/auth',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      path: '/api/auth',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  private setCsrfTokenCookie(
    res: Response,
    csrfToken: string,
    expiresAt: Date,
  ) {
    res.cookie(CSRF_TOKEN_COOKIE_NAME, csrfToken, {
      expires: expiresAt,
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  private clearCsrfTokenCookie(res: Response) {
    res.clearCookie(CSRF_TOKEN_COOKIE_NAME, {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  private setSessionCookies(
    res: Response,
    result: {
      refreshToken: string;
      refreshTokenExpiresAt: Date;
      csrfToken: string;
    },
  ) {
    this.setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );
    this.setCsrfTokenCookie(
      res,
      result.csrfToken,
      result.refreshTokenExpiresAt,
    );
  }

  private clearSessionCookies(res: Response) {
    this.clearRefreshTokenCookie(res);
    this.clearCsrfTokenCookie(res);
  }

  private toAuthResponse<
    T extends { refreshToken?: string; refreshTokenExpiresAt?: Date },
  >(result: T) {
    const responseBody = { ...result };
    delete responseBody.refreshToken;
    delete responseBody.refreshTokenExpiresAt;
    return responseBody;
  }

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto,
      this.getRequestContext(req),
    );
    this.setSessionCookies(res, result);

    return this.toAuthResponse(result);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshToken(req);

    if (!refreshToken) {
      this.clearSessionCookies(res);
      return this.authService.refreshSession('', this.getCsrfToken(req));
    }

    const result = await this.authService.refreshSession(
      refreshToken,
      this.requireCsrfToken(req),
      this.getRequestContext(req),
    );
    this.setSessionCookies(res, result);

    return this.toAuthResponse(result);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.getRefreshToken(req);
    const result = await this.authService.logoutSession(
      refreshToken,
      refreshToken ? this.requireCsrfToken(req) : this.getCsrfToken(req),
    );
    this.clearSessionCookies(res);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAllSessions(
      req.user.userId,
      this.getRefreshToken(req),
      this.requireCsrfToken(req),
    );
    this.clearSessionCookies(res);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('complete-registration')
  async completeRegistration(@Body() dto: CompleteRegistrationDto) {
    return this.authService.completeRegistration(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  async resendEmailVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendEmailVerification(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.userId, dto);
  }
}

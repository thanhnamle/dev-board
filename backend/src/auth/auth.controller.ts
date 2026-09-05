import { Controller, Get, Post, Query, Req, Res, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // 1. Bắt đầu luồng OAuth: Chuyển hướng sang GitHub Login
  @Get('github')
  githubLogin(@Res() res: Response) {
    const url = this.authService.getGitHubAuthUrl();
    return res.redirect(url);
  }

  // 2. Callback URL nhận mã code từ GitHub sau khi user cấp quyền
  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new UnauthorizedException('Authorization code missing');
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    try {
      const { sessionId } = await this.authService.handleGitHubCallback(code);

      // Lưu Session Token vào Cookie HttpOnly an toàn
      res.cookie('devboard_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        path: '/',
      });

      // Điều hướng về trang Dashboard của Frontend
      return res.redirect(`${frontendUrl}/app/github/profile`);
    } catch (err) {
      this.logger.error('Callback handling failed', err);
      return res.redirect(`${frontendUrl}/?error=oauth_failed`);
    }
  }

  // 3. Endpoint lấy thông tin User hiện tại (Frontend gọi khi khởi động)
  @Get('me')
  getMe(@Req() req: Request) {
    const sessionId = req.cookies?.devboard_session;
    const user = this.authService.getUserBySession(sessionId);

    if (!user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    // Không trả về accessToken cho client để đảm bảo bảo mật
    const { accessToken, ...safeUser } = user;
    return {
      authenticated: true,
      user: safeUser,
    };
  }

  // 4. Endpoint đăng xuất
  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    const sessionId = req.cookies?.devboard_session;
    if (sessionId) {
      this.authService.revokeSession(sessionId);
    }

    res.clearCookie('devboard_session', { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully' });
  }
}

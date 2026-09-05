import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const sessionId = req.cookies?.devboard_session;

    if (!sessionId) {
      throw new UnauthorizedException('Authentication required: Missing session cookie');
    }

    const user = this.authService.getUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Authentication required: Invalid or expired session');
    }

    // Gắn thông tin User đã xác thực vào request để Controller sử dụng
    req.user = user;
    return true;
  }
}

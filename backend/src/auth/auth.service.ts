import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

export interface AuthUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  bio: string;
  company: string | null;
  location: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Lưu session trong bộ nhớ cho Phase 3 (sẵn sàng chuyển sang CSDL PostgreSQL ở Phase 4)
  private readonly sessions = new Map<string, AuthUser>();

  constructor(private readonly config: ConfigService) {}

  getGitHubAuthUrl(): string {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const redirectUri = encodeURIComponent(
      this.config.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:3000/api/auth/github/callback',
    );
    const scope = encodeURIComponent('read:user user:email repo');
    const state = crypto.randomBytes(16).toString('hex');

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  }

  async handleGitHubCallback(code: string): Promise<{ sessionId: string; user: AuthUser }> {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.config.get<string>('GITHUB_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GITHUB_CALLBACK_URL');

    this.logger.log(`Exchanging OAuth code with GitHub...`);

    // 1. Gửi mã code và Client Secret lên GitHub để lấy Access Token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      this.logger.error(`GitHub OAuth error: ${JSON.stringify(tokenData)}`);
      throw new UnauthorizedException(tokenData.error_description || 'Failed to exchange GitHub access token');
    }

    const accessToken = tokenData.access_token;

    // 2. Dùng Access Token để lấy thông tin profile thật từ GitHub API
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'DevBoard-NestJS-Backend',
      },
    });

    if (!userRes.ok) {
      throw new UnauthorizedException('Failed to fetch user profile from GitHub');
    }

    const userData = await userRes.json();

    // 3. Chuẩn hóa dữ liệu User
    const user: AuthUser = {
      id: userData.id,
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
      bio: userData.bio || '',
      company: userData.company,
      location: userData.location,
      email: userData.email,
      public_repos: userData.public_repos || 0,
      followers: userData.followers || 0,
      following: userData.following || 0,
      accessToken,
    };

    // 4. Tạo mã Session ngẫu nhiên và lưu vào Store
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, user);

    this.logger.log(`Successfully authenticated user: @${user.login} (Session ID: ${sessionId})`);

    return { sessionId, user };
  }

  getUserBySession(sessionId: string): AuthUser | null {
    if (!sessionId) return null;
    return this.sessions.get(sessionId) || null;
  }

  revokeSession(sessionId: string): boolean {
    if (!sessionId) return false;
    return this.sessions.delete(sessionId);
  }
}

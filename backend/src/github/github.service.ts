import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  private async fetchGitHub(endpoint: string, accessToken: string) {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DevBoard-Backend',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`GitHub API error on ${endpoint} [${response.status}]: ${errText}`);
      throw new HttpException(
        `GitHub API returned ${response.status}: ${response.statusText}`,
        response.status || HttpStatus.BAD_GATEWAY,
      );
    }

    return response.json();
  }

  // 1. Lấy thông tin Profile chi tiết
  async getProfile(user: AuthUser) {
    return this.fetchGitHub('/user', user.accessToken);
  }

  // 2. Lấy danh sách Repositories (Cả Public & Private được cấp quyền)
  async getRepositories(user: AuthUser, perPage = 30) {
    return this.fetchGitHub(`/user/repos?sort=updated&per_page=${perPage}&affiliation=owner,collaborator`, user.accessToken);
  }

  // 3. Lấy thông báo Notifications thật (Phục vụ cho tab Messages)
  async getNotifications(user: AuthUser) {
    return this.fetchGitHub('/notifications?all=false', user.accessToken);
  }

  // 4. Lấy dòng thời gian sự kiện (Commits, PRs, Reviews)
  async getUserEvents(user: AuthUser) {
    return this.fetchGitHub(`/users/${user.login}/events?per_page=30`, user.accessToken);
  }
}

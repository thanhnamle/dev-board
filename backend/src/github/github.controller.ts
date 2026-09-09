import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GitHubService } from './github.service';
import { Request } from 'express';

@Controller('github')
@UseGuards(AuthGuard)
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  // GET /api/github/profile - Lấy profile thật của User
  @Get('profile')
  async getProfile(@Req() req: Request & { user: any }) {
    return this.githubService.getProfile(req.user);
  }

  // GET /api/github/repositories - Lấy repos của User
  @Get('repositories')
  async getRepositories(@Req() req: Request & { user: any }) {
    return this.githubService.getRepositories(req.user);
  }

  // GET /api/github/notifications - Lấy thông báo GitHub phục vụ Messages Hub
  @Get('notifications')
  async getNotifications(@Req() req: Request & { user: any }) {
    return this.githubService.getNotifications(req.user);
  }

  // GET /api/github/activities - Lấy events hoạt động gần đây
  @Get('activities')
  async getActivities(@Req() req: Request & { user: any }) {
    return this.githubService.getUserEvents(req.user);
  }

  // GET /api/github/contributions - Lấy full-year contribution calendar (GitHub GraphQL)
  @Get('contributions')
  async getContributions(
    @Req() req: Request & { user: any },
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : undefined;
    return this.githubService.getContributions(req.user, targetYear);
  }

  // GET /api/github/commits - Lấy commits của một repository cụ thể
  @Get('commits')
  async getCommits(
    @Req() req: Request & { user: any },
    @Query('repo') repo: string,
    @Query('per_page') perPage?: string,
  ) {
    const limit = perPage ? parseInt(perPage, 10) : 50;
    return this.githubService.getRepoCommits(req.user, repo, limit);
  }
}

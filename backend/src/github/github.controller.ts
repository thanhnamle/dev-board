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
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
    @Query('all') all?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limit = perPage ? parseInt(perPage, 10) : 100;
    const fetchAll = all === 'true' || all === '1';
    return this.githubService.getRepoCommits(req.user, repo, pageNum, limit, fetchAll);
  }

  // GET /api/github/pulls - Lấy danh sách Pull Requests của repository
  @Get('pulls')
  async getPulls(
    @Req() req: Request & { user: any },
    @Query('repo') repo: string,
    @Query('state') state?: string,
    @Query('per_page') perPage?: string,
  ) {
    const limit = perPage ? parseInt(perPage, 10) : 30;
    return this.githubService.getRepoPulls(req.user, repo, state || 'all', limit);
  }

  // GET /api/github/branches - Lấy danh sách branches của repository
  @Get('branches')
  async getBranches(
    @Req() req: Request & { user: any },
    @Query('repo') repo: string,
    @Query('per_page') perPage?: string,
  ) {
    const limit = perPage ? parseInt(perPage, 10) : 30;
    return this.githubService.getRepoBranches(req.user, repo, limit);
  }
}

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TelemetryGateway, TelemetryPayload } from './telemetry.gateway';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('TelemetryService');

  // Timers for automated radar
  private localGitTimer: NodeJS.Timeout | null = null;
  private githubApiTimer: NodeJS.Timeout | null = null;

  // Trackers
  private lastSeenCommitSha: string | null = null;
  private lastSeenGitHubEventId: string | null = null;
  private readonly gitDir = path.resolve(process.cwd(), '../.git');

  constructor(private readonly gateway: TelemetryGateway) {}

  onModuleInit() {
    this.logger.log('🚀 DevBoard Real-Time Telemetry Radar starting...');
    
    // 1. Initialize local git tracker
    this.initLocalGitTracker();

    // 2. Start local git watcher (checks every 2.5s for commits/pushes from VS Code or terminal)
    this.localGitTimer = setInterval(() => this.checkLocalGit(), 2500);

    // 3. Start cloud GitHub events poller (checks every 15s)
    this.githubApiTimer = setInterval(() => this.pollGitHubEvents(), 15000);
    // Initial fetch after 3 seconds
    setTimeout(() => this.pollGitHubEvents(), 3000);
  }

  onModuleDestroy() {
    if (this.localGitTimer) clearInterval(this.localGitTimer);
    if (this.githubApiTimer) clearInterval(this.githubApiTimer);
  }

  /**
   * Snapshot current commit so we don't spam toasts on server startup
   */
  private initLocalGitTracker() {
    try {
      const headRefPath = path.join(this.gitDir, 'refs', 'heads', 'main');
      if (fs.existsSync(headRefPath)) {
        this.lastSeenCommitSha = fs.readFileSync(headRefPath, 'utf-8').trim();
        this.logger.log(`📌 Telemetry tracking local Git main branch at commit: ${this.lastSeenCommitSha.substring(0, 7)}`);
      }
    } catch (e: any) {
      this.logger.warn(`Could not read local git head: ${e.message}`);
    }
  }

  /**
   * Monitor local Git repository for new commits & pushes
   */
  private checkLocalGit() {
    try {
      const headRefPath = path.join(this.gitDir, 'refs', 'heads', 'main');
      if (!fs.existsSync(headRefPath)) return;

      const currentSha = fs.readFileSync(headRefPath, 'utf-8').trim();
      if (!currentSha) return;

      if (!this.lastSeenCommitSha) {
        this.lastSeenCommitSha = currentSha;
        return;
      }

      if (currentSha !== this.lastSeenCommitSha) {
        this.logger.log(`⚡ Detected new local Git commit: ${currentSha.substring(0, 7)}`);
        this.lastSeenCommitSha = currentSha;

        let commitMsg = 'Pushed updates to repository';
        let author = 'thanhnamle';
        let shortSha = currentSha.substring(0, 7);

        try {
          const workspaceRoot = path.resolve(process.cwd(), '..');
          const gitOutput = execSync(`git log -1 --pretty=format:"%s||%an||%h" ${currentSha}`, {
            cwd: workspaceRoot,
            timeout: 3000,
          }).toString().trim();

          const parts = gitOutput.split('||');
          if (parts[0]) commitMsg = parts[0];
          if (parts[1]) author = parts[1];
          if (parts[2]) shortSha = parts[2];
        } catch (execErr: any) {
          this.logger.warn(`Could not extract git details via CLI: ${execErr.message}`);
        }

        const payload: TelemetryPayload = {
          id: `git_${currentSha.substring(0, 10)}`,
          type: 'push',
          repo: 'thanhnamle/dev-board',
          sender: {
            login: author,
            avatarUrl: `https://github.com/${author}.png`,
          },
          message: commitMsg,
          details: {
            branch: 'main',
            commitsCount: 1,
            headCommitSha: shortSha,
            url: `https://github.com/thanhnamle/dev-board/commit/${currentSha}`,
          },
          timestamp: new Date().toISOString(),
        };

        this.gateway.broadcast('git.event', payload);
      }
    } catch (err: any) {
      // Non-critical, avoid log noise
    }
  }

  /**
   * Poll GitHub Events API for remote activities (e.g., PRs, stars, remote merges)
   */
  private async pollGitHubEvents() {
    try {
      let token: string | undefined;
      const sessionFile = path.join(process.cwd(), '.sessions.json');
      if (fs.existsSync(sessionFile)) {
        const raw = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
        const users = Object.values(raw) as any[];
        if (users.length > 0) {
          token = users[0]?.accessToken;
        }
      }

      const headers: Record<string, string> = {
        'User-Agent': 'DevBoard-Backend',
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('https://api.github.com/users/thanhnamle/events?per_page=5', {
        headers,
      });

      if (!res.ok) return;

      const events: any[] = await res.json();
      if (!Array.isArray(events) || events.length === 0) return;

      if (!this.lastSeenGitHubEventId) {
        this.lastSeenGitHubEventId = String(events[0].id);
        return;
      }

      // Check if new events arrived
      const newEvents: any[] = [];
      for (const ev of events) {
        if (String(ev.id) === this.lastSeenGitHubEventId) break;
        newEvents.push(ev);
      }

      if (newEvents.length > 0) {
        this.lastSeenGitHubEventId = String(events[0].id);
        this.logger.log(`📡 [GitHubRadar] Detected ${newEvents.length} new event(s) from GitHub API!`);
        for (const ev of newEvents.reverse()) {
          const eventType = ev.type.replace('Event', '').toLowerCase();
          this.processWebhook({ 'x-github-event': eventType }, ev);
        }
      }
    } catch (e: any) {
      // Ignore network failures
    }
  }

  /**
   * Process incoming GitHub Webhook events and broadcast live to UI
   */
  processWebhook(headers: Record<string, any>, body: any): TelemetryPayload | null {
    const eventType = headers['x-github-event'] || headers['X-GitHub-Event'] || 'unknown';
    const deliveryId = headers['x-github-delivery'] || `delivery_${Date.now()}`;

    this.logger.log(`📥 Received GitHub Webhook: event=${eventType}, delivery=${deliveryId}`);

    let payload: TelemetryPayload | null = null;
    const repoName = body?.repository?.full_name || body?.repository?.name || 'thanhnamle/dev-board';
    const sender = {
      login: body?.sender?.login || body?.actor?.login || 'github-user',
      avatarUrl: body?.sender?.avatar_url || body?.actor?.avatar_url || 'https://github.com/identicons/github.png',
    };

    switch (eventType) {
      case 'push': {
        const branch = (body?.ref || body?.payload?.ref || '').replace('refs/heads/', '') || 'main';
        const commits = body?.commits || body?.payload?.commits || [];
        const commitCount = commits.length || body?.payload?.size || 1;
        const headCommit = commits[commits.length - 1] || body?.head_commit || body?.payload?.commits?.[0];
        const commitMsg = headCommit?.message || `Pushed ${commitCount} commit(s) to ${branch}`;

        payload = {
          id: deliveryId,
          type: 'push',
          repo: repoName,
          sender,
          message: commitMsg,
          details: {
            branch,
            commitsCount: commitCount,
            headCommitSha: (headCommit?.id || headCommit?.sha || 'git-push').substring(0, 7),
            url: body?.compare || headCommit?.url,
          },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'pull_request': {
        const action = body?.action || body?.payload?.action || 'opened';
        const pr = body?.pull_request || body?.payload?.pull_request;
        const prNumber = pr?.number || body?.number || 1;
        const prTitle = pr?.title || 'Pull Request Update';

        payload = {
          id: deliveryId,
          type: 'pull_request',
          repo: repoName,
          sender,
          message: `PR #${prNumber} (${action}): ${prTitle}`,
          details: {
            prNumber,
            prAction: action,
            branch: pr?.head?.ref || 'feature',
            url: pr?.html_url,
          },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'watch':
      case 'star': {
        payload = {
          id: deliveryId,
          type: 'star',
          repo: repoName,
          sender,
          message: `starred repository ${repoName}`,
          details: {
            url: body?.repository?.html_url,
          },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'issues': {
        const issue = body?.issue || body?.payload?.issue;
        payload = {
          id: deliveryId,
          type: 'issue',
          repo: repoName,
          sender,
          message: `Issue #${issue?.number} (${body?.action}): ${issue?.title || ''}`,
          details: {
            url: issue?.html_url,
          },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'ping': {
        payload = {
          id: deliveryId,
          type: 'ping',
          repo: repoName,
          sender,
          message: body?.zen || 'GitHub Webhook Ping: successfully connected!',
          details: {},
          timestamp: new Date().toISOString(),
        };
        break;
      }

      default: {
        payload = {
          id: deliveryId,
          type: 'push',
          repo: repoName,
          sender,
          message: `GitHub event '${eventType}' on ${repoName}`,
          details: body,
          timestamp: new Date().toISOString(),
        };
      }
    }

    if (payload) {
      this.gateway.broadcast('git.event', payload);
    }

    return payload;
  }

  /**
   * Simulate a realistic Git event for local testing & live demonstrations
   */
  simulate(options?: {
    type?: 'push' | 'pull_request' | 'star';
    repo?: string;
    message?: string;
    branch?: string;
    senderLogin?: string;
  }): TelemetryPayload {
    const type = options?.type || (Math.random() > 0.3 ? 'push' : 'pull_request');
    const repo = options?.repo || 'thanhnamle/dev-board';
    const senderLogin = options?.senderLogin || 'thanhnamle';
    const avatarUrl = `https://github.com/${senderLogin}.png`;
    const randomSha = Math.random().toString(36).substring(2, 9);

    const mockMessages = {
      push: [
        `feat(telemetry): integrate real-time WebSocket radar and live telemetry`,
        `fix(analytics): dynamic date window calculations for weekly velocity`,
        `perf(cache): debounce repository search signals for instant responsiveness`,
        `style(obsidian): fine-tune glassmorphism gradients and borders`,
        `refactor(gateway): optimize event broadcasting channel`,
      ],
      pull_request: [
        `Implement real-time GitHub Webhook dispatcher and SSE fallback`,
        `Add interactive SVG velocity curve with dual-theme obsidian palette`,
        `Refactor GitHub sync service to support background telemetry polling`,
      ],
      star: [
        `starred repository ${repo}`,
      ],
    };

    let message = options?.message;
    if (!message) {
      const msgs = mockMessages[type] || mockMessages.push;
      message = msgs[Math.floor(Math.random() * msgs.length)];
    }

    const payload: TelemetryPayload = {
      id: `sim_${Date.now()}_${randomSha}`,
      type,
      repo,
      sender: {
        login: senderLogin,
        avatarUrl,
      },
      message,
      details: {
        branch: options?.branch || (type === 'push' ? 'main' : 'feature/live-radar'),
        commitsCount: 1,
        headCommitSha: randomSha,
        prNumber: type === 'pull_request' ? Math.floor(Math.random() * 40) + 1 : undefined,
        prAction: type === 'pull_request' ? 'opened' : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    this.gateway.broadcast('git.event', payload);
    return payload;
  }

  getStatus() {
    return {
      status: 'online',
      activeClients: this.gateway.getClientCount(),
      lastSeenCommitSha: this.lastSeenCommitSha?.substring(0, 7),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

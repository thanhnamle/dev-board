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
  private lastSeenLocalSha: string | null = null;
  private lastSeenRemoteSha: string | null = null;
  private lastSeenGitHubEventId: string | null = null;
  private readonly recentlyEmitted = new Map<string, number>();
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
   * Check if an event was recently broadcasted within 60s to prevent duplicates
   */
  private shouldEmit(key: string): boolean {
    const now = Date.now();
    for (const [k, time] of this.recentlyEmitted.entries()) {
      if (now - time > 60000) {
        this.recentlyEmitted.delete(k);
      }
    }
    if (this.recentlyEmitted.has(key)) {
      return false;
    }
    this.recentlyEmitted.set(key, now);
    return true;
  }

  /**
   * Snapshot current commit so we don't spam toasts on server startup
   */
  private initLocalGitTracker() {
    try {
      const headRefPath = path.join(this.gitDir, 'refs', 'heads', 'main');
      const remoteRefPath = path.join(this.gitDir, 'refs', 'remotes', 'origin', 'main');
      if (fs.existsSync(headRefPath)) {
        this.lastSeenLocalSha = fs.readFileSync(headRefPath, 'utf-8').trim();
      }
      if (fs.existsSync(remoteRefPath)) {
        this.lastSeenRemoteSha = fs.readFileSync(remoteRefPath, 'utf-8').trim();
      }
      this.logger.log(
        `📌 Telemetry tracking local Git: main@${this.lastSeenLocalSha?.substring(0, 7)} (origin/main@${this.lastSeenRemoteSha?.substring(0, 7)})`,
      );
    } catch (e: any) {
      this.logger.warn(`Could not read local git head: ${e.message}`);
    }
  }

  /**
   * Monitor local Git repository: distinguishes local COMMIT vs remote PUSH
   */
  private checkLocalGit() {
    try {
      const headRefPath = path.join(this.gitDir, 'refs', 'heads', 'main');
      const remoteRefPath = path.join(this.gitDir, 'refs', 'remotes', 'origin', 'main');

      const currentRemoteSha = fs.existsSync(remoteRefPath)
        ? fs.readFileSync(remoteRefPath, 'utf-8').trim()
        : '';

      // 1. Check local branch HEAD (heads/main)
      if (fs.existsSync(headRefPath)) {
        const currentLocalSha = fs.readFileSync(headRefPath, 'utf-8').trim();
        if (currentLocalSha && !this.lastSeenLocalSha) {
          this.lastSeenLocalSha = currentLocalSha;
        } else if (currentLocalSha && currentLocalSha !== this.lastSeenLocalSha) {
          this.lastSeenLocalSha = currentLocalSha;

          // If local sha equals remote sha, it is already pushed. Otherwise it is a local commit!
          const isPush = currentRemoteSha === currentLocalSha;
          const eventType: 'commit' | 'push' = isPush ? 'push' : 'commit';
          this.broadcastLocalGitEvent(currentLocalSha, eventType, 'main');
        }
      }

      // 2. Check remote tracking branch (remotes/origin/main)
      if (currentRemoteSha) {
        if (!this.lastSeenRemoteSha) {
          this.lastSeenRemoteSha = currentRemoteSha;
        } else if (currentRemoteSha !== this.lastSeenRemoteSha) {
          this.lastSeenRemoteSha = currentRemoteSha;
          // Remote updated! This is an actual PUSH to origin/main!
          this.broadcastLocalGitEvent(currentRemoteSha, 'push', 'main');
        }
      }
    } catch (err: any) {
      // Non-critical, avoid log noise
    }
  }

  private broadcastLocalGitEvent(sha: string, type: 'commit' | 'push', branch: string = 'main') {
    const shortSha = sha.substring(0, 7);
    const dedupKey = `${shortSha}_${type}`;
    if (!this.shouldEmit(dedupKey)) {
      return;
    }

    let commitMsg = type === 'push' ? 'Pushed updates to repository' : 'Committed changes locally';
    let author = 'thanhnamle';

    try {
      const workspaceRoot = path.resolve(process.cwd(), '..');
      const gitOutput = execSync(`git log -1 --pretty=format:"%s||%an||%h" ${sha}`, {
        cwd: workspaceRoot,
        timeout: 3000,
      }).toString().trim();

      const parts = gitOutput.split('||');
      if (parts[0]) commitMsg = parts[0];
      if (parts[1]) author = parts[1];
    } catch (execErr: any) {
      this.logger.warn(`Could not extract git details via CLI: ${execErr.message}`);
    }

    this.logger.log(`⚡ Broadcasting ${type.toUpperCase()}: [${shortSha}] ${commitMsg}`);

    const payload: TelemetryPayload = {
      id: `git_${sha.substring(0, 10)}_${type}`,
      type,
      repo: 'thanhnamle/dev-board',
      sender: {
        login: author,
        avatarUrl: `https://github.com/${author}.png`,
      },
      message: commitMsg,
      details: {
        branch,
        commitsCount: 1,
        headCommitSha: shortSha,
        url: `https://github.com/thanhnamle/dev-board/commit/${sha}`,
      },
      timestamp: new Date().toISOString(),
    };

    this.gateway.broadcast('git.event', payload);
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
    type?: 'push' | 'commit' | 'pull_request' | 'star';
    repo?: string;
    message?: string;
    branch?: string;
    senderLogin?: string;
    sha?: string;
  }): TelemetryPayload {
    const type = options?.type || (Math.random() > 0.3 ? 'push' : 'commit');
    const randomSha = options?.sha || Math.random().toString(36).substring(2, 9);
    const shortSha = randomSha.substring(0, 7);

    // Deduplication check: ignore if recently emitted within 60s
    const dedupKey = `${shortSha}_${type}`;
    if (!this.shouldEmit(dedupKey)) {
      this.logger.log(`⏭️ Ignored duplicate simulate/hook event for ${dedupKey}`);
      return {
        id: `sim_skipped_${dedupKey}`,
        type,
        repo: options?.repo || 'thanhnamle/dev-board',
        sender: { login: options?.senderLogin || 'thanhnamle', avatarUrl: '' },
        message: options?.message || 'Duplicate skipped',
        timestamp: new Date().toISOString(),
      };
    }

    const repo = options?.repo || 'thanhnamle/dev-board';
    const senderLogin = options?.senderLogin || 'thanhnamle';
    const avatarUrl = `https://github.com/${senderLogin}.png`;

    const mockMessages: Record<string, string[]> = {
      commit: [
        `feat(core): implement granular telemetry signal bindings`,
        `fix(chart): handle missing timestamps gracefully`,
        `refactor(state): streamline signals and reduce reactive overhead`,
        `perf(cache): debounce repository search signals for instant responsiveness`,
      ],
      push: [
        `feat(telemetry): integrate real-time WebSocket radar and live telemetry`,
        `fix(analytics): dynamic date window calculations for weekly velocity`,
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
      const msgs = mockMessages[type] || mockMessages.commit;
      message = msgs[Math.floor(Math.random() * msgs.length)];
    }

    const payload: TelemetryPayload = {
      id: `sim_${Date.now()}_${shortSha}`,
      type,
      repo,
      sender: {
        login: senderLogin,
        avatarUrl,
      },
      message,
      details: {
        branch: options?.branch || (type === 'pull_request' ? 'feature/live-radar' : 'main'),
        commitsCount: 1,
        headCommitSha: shortSha,
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
      lastSeenLocalSha: this.lastSeenLocalSha?.substring(0, 7),
      lastSeenRemoteSha: this.lastSeenRemoteSha?.substring(0, 7),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

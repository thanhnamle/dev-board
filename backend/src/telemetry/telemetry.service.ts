import { Injectable, Logger } from '@nestjs/common';
import { TelemetryGateway, TelemetryPayload } from './telemetry.gateway';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger('TelemetryService');

  constructor(private readonly gateway: TelemetryGateway) {}

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
      login: body?.sender?.login || 'github-user',
      avatarUrl: body?.sender?.avatar_url || 'https://github.com/identicons/github.png',
    };

    switch (eventType) {
      case 'push': {
        const branch = (body?.ref || '').replace('refs/heads/', '') || 'main';
        const commits = body?.commits || [];
        const commitCount = commits.length || 1;
        const headCommit = commits[commits.length - 1] || body?.head_commit;
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
            headCommitSha: headCommit?.id?.substring(0, 7) || 'git-push',
            url: body?.compare || headCommit?.url,
          },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'pull_request': {
        const action = body?.action || 'opened';
        const pr = body?.pull_request;
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
        const issue = body?.issue;
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
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

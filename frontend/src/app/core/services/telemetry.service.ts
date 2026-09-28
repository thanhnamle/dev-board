import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { GitHubApiService } from './github-api.service';

export interface LiveToastItem {
  id: string;
  type: 'push' | 'pull_request' | 'star' | 'release' | 'issue' | 'ping';
  repo: string;
  title: string;
  message: string;
  senderLogin: string;
  senderAvatar: string;
  timestamp: string;
  details?: any;
}

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly gitHubApi = inject(GitHubApiService);

  private socket: Socket | null = null;
  private readonly serverUrl = 'http://localhost:3000';

  // Signals
  readonly isConnected = signal<boolean>(false);
  readonly latestEvent = signal<LiveToastItem | null>(null);
  readonly activeToasts = signal<LiveToastItem[]>([]);
  readonly totalEventsReceived = signal<number>(0);
  readonly isSimulating = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initSocket();
    }
  }

  private initSocket() {
    try {
      this.socket = io(this.serverUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        console.log('⚡ [TelemetryService] Connected to DevBoard Real-Time Gateway:', this.socket?.id);
        this.isConnected.set(true);
      });

      this.socket.on('disconnect', () => {
        console.warn('🔌 [TelemetryService] Disconnected from DevBoard Gateway');
        this.isConnected.set(false);
      });

      this.socket.on('connect_error', (err) => {
        // Backend may not be started yet or port 3000 is loading
        this.isConnected.set(false);
      });

      // Listen for incoming live Git events
      this.socket.on('git.event', (data: any) => {
        this.handleIncomingGitEvent(data);
      });

      this.socket.on('telemetry.status', (status: any) => {
        console.log('📡 [TelemetryService] Server Status:', status);
      });
    } catch (err) {
      console.warn('[TelemetryService] Socket initialization error:', err);
    }
  }

  private handleIncomingGitEvent(raw: any) {
    if (!raw) return;

    const toastItem: LiveToastItem = {
      id: raw.id || `evt_${Date.now()}`,
      type: raw.type || 'push',
      repo: raw.repo || 'thanhnamle/dev-board',
      title: this.formatEventTitle(raw),
      message: raw.message || 'Incoming git action received',
      senderLogin: raw.sender?.login || 'developer',
      senderAvatar: raw.sender?.avatarUrl || 'https://github.com/identicons/github.png',
      timestamp: raw.timestamp || new Date().toISOString(),
      details: raw.details || {},
    };

    // Update signal states
    this.latestEvent.set(toastItem);
    this.totalEventsReceived.update(n => n + 1);

    // Push into active toasts (stack at top, maximum 3 concurrent toasts)
    this.activeToasts.update(current => [toastItem, ...current.slice(0, 2)]);

    // Update GitHubApiService reactive signals immediately!
    this.gitHubApi.handleRealtimeGitEvent({
      type: toastItem.type,
      repo: toastItem.repo,
      sender: {
        login: toastItem.senderLogin,
        avatarUrl: toastItem.senderAvatar,
      },
      message: toastItem.message,
      details: toastItem.details,
      timestamp: toastItem.timestamp,
    });

    // Auto dismiss after 7.5 seconds
    setTimeout(() => {
      this.dismissToast(toastItem.id);
    }, 7500);
  }

  dismissToast(id: string) {
    this.activeToasts.update(current => current.filter(t => t.id !== id));
  }

  private formatEventTitle(event: any): string {
    switch (event.type) {
      case 'push':
        return `New Push on ${event.details?.branch || 'main'}`;
      case 'pull_request':
        return `Pull Request #${event.details?.prNumber || ''}`;
      case 'star':
        return `New Star Received`;
      case 'issue':
        return `Issue Activity`;
      default:
        return `Git Radar Event`;
    }
  }

  /**
   * Trigger a simulated live push / PR / star to test without needing GitHub webhook tunnel
   */
  async simulateEvent(type: 'push' | 'pull_request' | 'star' = 'push') {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isSimulating.set(true);

    try {
      const res = await fetch(`${this.serverUrl}/api/telemetry/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      return await res.json();
    } catch (err) {
      console.error('[TelemetryService] Simulate request failed:', err);
    } finally {
      this.isSimulating.set(false);
    }
  }
}

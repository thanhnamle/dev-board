import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AppNotification {
  id: string;
  type: 'push' | 'commit' | 'pull_request' | 'star' | 'release' | 'issue' | 'ping' | 'system';
  title: string;
  message: string;
  repo?: string;
  senderLogin?: string;
  senderAvatar?: string;
  branch?: string;
  sha?: string;
  timestamp: string; // ISO string
  read: boolean;
  url?: string;
}

const STORAGE_KEY = 'devboard_notifications_v1';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly platformId = inject(PLATFORM_ID);

  // Reactive state
  readonly notifications = signal<AppNotification[]>([]);
  readonly isOpen = signal<boolean>(false);
  readonly filter = signal<'all' | 'unread'>('all');

  // Computed signals
  readonly unreadCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  readonly filteredNotifications = computed(() => {
    const list = this.notifications();
    if (this.filter() === 'unread') {
      return list.filter(n => !n.read);
    }
    return list;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
      // Periodically clean notifications older than 3 days every 30 minutes
      setInterval(() => {
        this.purgeExpired();
      }, 30 * 60 * 1000);
    }
  }

  toggleOpen() {
    this.isOpen.update(v => !v);
  }

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  setFilter(f: 'all' | 'unread') {
    this.filter.set(f);
  }

  /**
   * Add a new notification. Older than 3 days are purged automatically.
   */
  addNotification(item: Omit<AppNotification, 'id' | 'read' | 'timestamp'> & { id?: string; timestamp?: string }) {
    const newNotif: AppNotification = {
      id: item.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: item.type,
      title: item.title,
      message: item.message,
      repo: item.repo || 'thanhnamle/dev-board',
      senderLogin: item.senderLogin || 'thanhnamle',
      senderAvatar: item.senderAvatar || 'https://github.com/thanhnamle.png',
      branch: item.branch,
      sha: item.sha,
      timestamp: item.timestamp || new Date().toISOString(),
      read: false,
      url: item.url,
    };

    this.notifications.update(current => {
      // Prepend new notification and purge any older than 3 days
      const updated = [newNotif, ...current];
      return this.filterValid(updated);
    });

    this.saveToStorage();
  }

  markAsRead(id: string) {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.saveToStorage();
  }

  markAllAsRead() {
    this.notifications.update(list =>
      list.map(n => ({ ...n, read: true }))
    );
    this.saveToStorage();
  }

  deleteNotification(id: string) {
    this.notifications.update(list => list.filter(n => n.id !== id));
    this.saveToStorage();
  }

  clearAll() {
    this.notifications.set([]);
    this.saveToStorage();
  }

  /**
   * Purge all notifications older than 3 days (3 * 24 * 60 * 60 * 1000 ms)
   */
  private purgeExpired() {
    const current = this.notifications();
    const valid = this.filterValid(current);
    if (valid.length !== current.length) {
      console.log(`🧹 [NotificationService] Purged ${current.length - valid.length} expired notification(s) older than 3 days`);
      this.notifications.set(valid);
      this.saveToStorage();
    }
  }

  private filterValid(list: AppNotification[]): AppNotification[] {
    const now = Date.now();
    return list.filter(n => {
      const itemTime = new Date(n.timestamp).getTime();
      return (now - itemTime) < THREE_DAYS_MS;
    });
  }

  private loadFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = this.filterValid(parsed);
          this.notifications.set(valid);
          if (valid.length !== parsed.length) {
            this.saveToStorage();
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Failed to load notifications from localStorage:', err);
    }

    // Default seed notifications for demo if empty
    this.seedDefaultNotifications();
  }

  private saveToStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const valid = this.filterValid(this.notifications()).slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    } catch (err) {
      console.warn('[NotificationService] Failed to save notifications to localStorage:', err);
    }
  }

  private seedDefaultNotifications() {
    const now = Date.now();
    const defaultItems: AppNotification[] = [
      {
        id: 'seed_1',
        type: 'push',
        title: 'New Push on main',
        message: 'refactor: enhance analytics dashboard with dynamic chart titles and descriptions',
        repo: 'thanhnamle/dev-board',
        senderLogin: 'thanhnamle',
        senderAvatar: 'https://github.com/thanhnamle.png',
        branch: 'main',
        sha: 'a298167',
        timestamp: new Date(now - 12 * 60 * 1000).toISOString(), // 12 mins ago
        read: false,
      },
      {
        id: 'seed_2',
        type: 'pull_request',
        title: 'PR #12 Merged',
        message: 'feat(radar): integrate real-time WebSocket radar and live telemetry',
        repo: 'thanhnamle/dev-board',
        senderLogin: 'thanhnamle',
        senderAvatar: 'https://github.com/thanhnamle.png',
        branch: 'main',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: true,
      },
      {
        id: 'seed_3',
        type: 'star',
        title: 'New Star Received',
        message: 'thanhnamle starred repository thanhnamle/dev-board',
        repo: 'thanhnamle/dev-board',
        senderLogin: 'thanhnamle',
        senderAvatar: 'https://github.com/thanhnamle.png',
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: true,
      }
    ];
    this.notifications.set(defaultItems);
    this.saveToStorage();
  }
}

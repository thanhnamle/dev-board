import { computed, Injectable, signal } from '@angular/core';

export type MessageCategory = 'mentions' | 'reviews' | 'system';
export interface ThreadMessage { author: string; body: string; local?: boolean; }
export interface MessageThread {
  id: number;
  category: MessageCategory;
  title: string;
  repository: string;
  unread: boolean;
  messages: ThreadMessage[];
}

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private readonly state = signal<MessageThread[]>([
    { id: 1, category: 'mentions', title: 'Debounce the repository search', repository: 'devboard/frontend', unread: true,
      messages: [{ author: 'Alex', body: 'Could you share the signal debounce helper? We can reuse it for repository search.' }] },
    { id: 2, category: 'reviews', title: 'Review webhook signature validation', repository: 'devboard/api', unread: true,
      messages: [{ author: 'Minh', body: 'Please review the HMAC validation before we connect GitHub webhooks. The comparison should use a constant-time operation.' }] },
    { id: 3, category: 'system', title: 'Staging build needs attention', repository: 'devboard/frontend', unread: true,
      messages: [{ author: 'Build bot', body: 'Demo alert: the staging build exceeded the component stylesheet budget. Check the build output before retrying.' }] },
    { id: 4, category: 'mentions', title: 'Database upsert pattern', repository: 'devboard/api', unread: false,
      messages: [{ author: 'Linh', body: 'Do we have a reusable PostgreSQL upsert example for user profiles?' }] }
  ]);
  readonly threads = this.state.asReadonly();
  readonly unreadCount = computed(() => this.threads().filter(thread => thread.unread).length);

  markRead(id: number) {
    this.state.update(threads => threads.map(thread => thread.id === id ? { ...thread, unread: false } : thread));
  }

  markAllRead() {
    this.state.update(threads => threads.map(thread => ({ ...thread, unread: false })));
  }

  addLocalReply(id: number, body: string): boolean {
    const text = body.trim();
    if (!text || text.length > 10000 || !this.threads().some(thread => thread.id === id && thread.category !== 'system')) return false;
    this.state.update(threads => threads.map(thread => thread.id === id
      ? { ...thread, messages: [...thread.messages, { author: 'You', body: text, local: true }] }
      : thread));
    return true;
  }
}

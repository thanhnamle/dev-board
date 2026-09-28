import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  X,
  GitCommit,
  GitPullRequest,
  Star,
  Sparkles,
  Clock,
  ExternalLink,
  Check,
} from 'lucide-angular';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.css'],
})
export class NotificationPanelComponent {
  readonly notifService = inject(NotificationService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  // Lucide Icons
  readonly Bell = Bell;
  readonly BellOff = BellOff;
  readonly CheckCheck = CheckCheck;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly GitCommit = GitCommit;
  readonly GitPullRequest = GitPullRequest;
  readonly Star = Star;
  readonly Sparkles = Sparkles;
  readonly Clock = Clock;
  readonly ExternalLink = ExternalLink;
  readonly Check = Check;

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.notifService.isOpen()) {
      this.notifService.close();
    }
  }

  close() {
    this.notifService.close();
  }

  setFilter(filter: 'all' | 'unread') {
    this.notifService.setFilter(filter);
  }

  markAllAsRead() {
    this.notifService.markAllAsRead();
  }

  clearAll() {
    this.notifService.clearAll();
  }

  onItemClick(item: AppNotification) {
    if (!item.read) {
      this.notifService.markAsRead(item.id);
    }
  }

  onItemDelete(event: Event, id: string) {
    event.stopPropagation();
    this.notifService.deleteNotification(id);
  }

  viewWorkspace(event: Event, item: AppNotification) {
    event.stopPropagation();
    this.notifService.markAsRead(item.id);
    this.notifService.close();
    this.router.navigate(['/app/projects/workspace']);
  }

  formatTimeAgo(isoString: string): string {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  }
}

import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import {
  LucideAngularModule,
  LayoutGrid,
  Folder,
  NotebookPen,
  Code2,
  Github,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  Sun,
  Moon,
  MessageSquare,
  Sparkles,
  Bookmark,
  Star,
  Activity,
  Layers
} from 'lucide-angular';

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl?: string;
  status?: string;
}

export interface SubMenuItem {
  label: string;
  path: string;
  badge?: string;
  badgeClass?: string;
}

export interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  badge?: string;
  badgeClass?: string;
  children?: SubMenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // Theme Service toàn cục
  readonly themeService = inject(ThemeService);

  // Khai báo icon
  readonly Search = Search;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ChevronUp = ChevronUp;
  readonly ChevronDown = ChevronDown;
  readonly Minus = Minus;
  readonly Plus = Plus;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly MessageSquare = MessageSquare;
  readonly Sparkles = Sparkles;

  // Signal quản lý trạng thái thu gọn sidebar
  collapsed = signal(false);

  mainExpanded = signal(true);
  messageExpanded = signal(true);

  // Mặc định đang mở mục 'Dashboard'
  expandedItem = signal<string | null>('Dashboard');

  currentUser = signal<UserProfile>({
    name: 'Thành Nam',
    role: 'Lead Architect',
    avatarUrl: 'assets/Avatar.jpg',
    status: 'Online'
  });

  // Danh sách menu chính với Badges chuẩn Linear Obsidian
  mainMenu: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutGrid,
      children: [
        { label: 'Overview', path: '/app/dashboard/overview' },
        { label: 'Analytics', path: '/app/dashboard/analytics', badge: 'Live', badgeClass: 'badge-cyan' }
      ]
    },
    {
      label: 'Projects',
      icon: Folder,
      badge: '8',
      path: '/app/projects',
      children: [
        { label: 'All Projects', path: '/app/projects/all-projects', badge: '8' },
        { label: 'Bookmarks', path: '/app/projects/bookmarks', badge: '3' },
        { label: 'Starred', path: '/app/projects/starred', badge: '5' }
      ]
    },
    {
      label: 'Notes',
      icon: NotebookPen,
      badge: '19',
      path: '/app/notes',
      children: [
        { label: 'All Notes', path: '/app/notes/all-notes', badge: '19' },
        { label: 'By Tags', path: '/app/notes/tags' }
      ]
    },
    {
      label: 'Snippets',
      icon: Code2,
      badge: '64',
      path: '/app/snippets',
      children: [
        { label: 'All Snippets', path: '/app/snippets/all-snippets', badge: '64' },
        { label: 'Favorites', path: '/app/snippets/favorites', badge: '12' }
      ]
    },
    {
      label: 'Github',
      icon: Github,
      path: '/app/github',
      children: [
        { label: 'Profile', path: '/app/github/profile' },
        { label: 'Repositories', path: '/app/github/repositories', badge: '8' },
        { label: 'Activities', path: '/app/github/activities' }
      ]
    }
  ];

  messageMenu: MenuItem[] = [
    {
      label: 'Messages',
      icon: MessageSquare,
      path: '/app/messages',
      badge: '3',
      badgeClass: 'badge-emerald'
    }
  ];

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleMain() {
    this.mainExpanded.update(v => !v);
  }

  toggleMessage() {
    this.messageExpanded.update(v => !v);
  }

  toggleSidebar() {
    this.collapsed.update(v => !v);
  }

  toggleExpand(label: string) {
    if (this.collapsed()) {
      this.collapsed.set(false);
      this.expandedItem.set(label);
    } else {
      this.expandedItem.update(curr => (curr === label ? null : label));
    }
  }
}

import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  FolderGit2,
  LogOut,
  User,
  Settings,
  ExternalLink
} from 'lucide-angular';
import { UserService } from '../../core/services/user.service';
import { MessagesService } from '../../core/services/messages.service';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { WorkspaceDataService } from '../../core/services/workspace-data.service';

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl?: string;
  status?: string;
}

export interface SubMenuItem {
  label: string;
  path: string;
  badge?: string | (() => number);
  badgeClass?: string;
}

export interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  badge?: string | (() => number);
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
  private readonly router = inject(Router);
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
  readonly LogOut = LogOut;
  readonly User = User;
  readonly Settings = Settings;
  readonly ExternalLink = ExternalLink;
  readonly FolderGit2 = FolderGit2;
  readonly userService = inject(UserService);
  readonly messagesService = inject(MessagesService);
  readonly commandPalette = inject(CommandPaletteService);
  private readonly workspace = inject(WorkspaceDataService);

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

  userMenuOpen = signal<boolean>(false);

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
      badge: () => this.workspace.projects().length,
      path: '/app/projects',
      children: [
        { label: 'All Projects', path: '/app/projects/all-projects', badge: () => this.workspace.projects().length },
        { label: 'Bookmarks', path: '/app/projects/bookmarks', badge: () => this.workspace.projects().filter(project => project.isBookmarked).length },
        { label: 'Starred', path: '/app/projects/starred', badge: () => this.workspace.projects().filter(project => project.isStarred).length }
      ]
    },
    {
      label: 'Notes',
      icon: NotebookPen,
      badge: () => this.workspace.notes().length,
      path: '/app/notes',
      children: [
        { label: 'All Notes', path: '/app/notes/all-notes', badge: () => this.workspace.notes().length },
        { label: 'By Tags', path: '/app/notes/tags' }
      ]
    },
    {
      label: 'Snippets',
      icon: Code2,
      badge: () => this.workspace.snippets().length,
      path: '/app/snippets',
      children: [
        { label: 'All Snippets', path: '/app/snippets/all-snippets', badge: () => this.workspace.snippets().length },
        { label: 'Favorites', path: '/app/snippets/favorites' }
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
      badgeClass: 'badge-emerald'
    }
  ];

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  badgeValue(badge: string | (() => number) | undefined) {
    return typeof badge === 'function' ? badge() : badge;
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

  toggleUserMenu() {
    this.userMenuOpen.update(open => !open);
  }

  logout() {
    this.userMenuOpen.set(false);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('github_token');
    }

    this.router.navigate(['/']);
  }
}

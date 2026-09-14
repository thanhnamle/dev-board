import { Component, signal, computed, inject } from '@angular/core';
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
  ExternalLink,
  Bookmark
} from 'lucide-angular';
import { UserService } from '../../core/services/user.service';
import { MessagesService } from '../../core/services/messages.service';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { WorkspaceDataService } from '../../core/services/workspace-data.service';
import { GitHubApiService } from '../../core/services/github-api.service';

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
  readonly Bookmark = Bookmark;
  readonly userService = inject(UserService);
  readonly messagesService = inject(MessagesService);
  readonly commandPalette = inject(CommandPaletteService);
  readonly gitHubApiService = inject(GitHubApiService);
  readonly workspace = inject(WorkspaceDataService);

  readonly bookmarkedProjects = computed(() =>
    this.workspace.projects().filter(p => p.isBookmarked).slice(0, 4)
  );

  // Signal quản lý trạng thái thu gọn sidebar
  collapsed = signal(false);

  mainExpanded = signal(true);
  discussionsExpanded = signal(true);
  messageExpanded = this.discussionsExpanded;

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
      label: 'Repositories',
      icon: FolderGit2,
      badge: () => this.workspace.projects().length,
      path: '/app/projects/all-projects',
      children: [
        { label: 'All Repositories', path: '/app/projects/all-projects', badge: () => this.workspace.projects().length },
        { label: 'Bookmarks', path: '/app/projects/bookmarks', badge: () => this.workspace.projects().filter(project => project.isBookmarked).length, badgeClass: 'badge-purple' },
        { label: 'Starred', path: '/app/projects/starred', badge: () => this.workspace.projects().filter(project => project.isStarred).length, badgeClass: 'badge-amber' }
      ]
    },
    {
      label: 'GitHub',
      icon: Github,
      path: '/app/github',
      children: [
        { label: 'Profile', path: '/app/github/profile' },
        { label: 'Activities', path: '/app/github/activities' }
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
    }
  ];

  discussionMenu: MenuItem[] = [
    {
      label: 'Discussions',
      icon: MessageSquare,
      path: '/app/discussions',
      badgeClass: 'badge-emerald'
    }
  ];
  messageMenu = this.discussionMenu;

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  badgeValue(badge: string | (() => number) | undefined) {
    return typeof badge === 'function' ? badge() : badge;
  }

  toggleMain() {
    this.mainExpanded.update(v => !v);
  }

  toggleDiscussions() {
    this.discussionsExpanded.update(v => !v);
  }

  toggleMessage() {
    this.toggleDiscussions();
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

  async logout() {
    this.userMenuOpen.set(false);
    await this.gitHubApiService.logout();

    if (typeof window !== 'undefined') {
      localStorage.removeItem('github_token');
    }

    this.router.navigate(['/']);
  }

  getLanguageColor(lang: string | null | undefined): string {
    const map: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Go: '#00add8',
      Python: '#3572A5',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Dockerfile: '#384d54',
      Shell: '#89e051',
      Rust: '#dea584',
      Java: '#b07219',
      'C++': '#f34b7d',
      'C#': '#178600'
    };
    return (lang && map[lang]) ? map[lang] : '#818cf8';
  }
}

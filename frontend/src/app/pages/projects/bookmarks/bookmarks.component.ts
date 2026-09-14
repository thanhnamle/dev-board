import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Bookmark,
  Search,
  ExternalLink,
  FolderGit2,
  BookOpen,
  Globe,
  Plus,
  Trash2,
  Star,
  Layers,
  Sparkles,
  Tag,
  RefreshCw,
  X,
  Check
} from 'lucide-angular';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { GitHubApiService } from '../../../core/services/github-api.service';

export type BookmarkCategory = 'all' | 'repos' | 'specs' | 'tools';

export interface BookmarkItem {
  id: number;
  title: string;
  url: string;
  description: string;
  category: 'repos' | 'specs' | 'tools';
  categoryLabel: string;
  categoryIcon: any;
  tags: string[];
  pinned: boolean;
  lastVisited: string;
}

const CUSTOM_BOOKMARKS_KEY = 'devboard_custom_bookmarks';
const PINNED_BOOKMARKS_KEY = 'devboard_pinned_bookmark_ids';

const DEFAULT_SPECS_AND_TOOLS: BookmarkItem[] = [
  {
    id: 101,
    title: 'Angular 17 Signals & Control Flow Docs',
    url: 'https://angular.dev/guide/signals',
    description: 'Official Angular architecture guide covering Signals, computed values, and the new template control flow.',
    category: 'specs',
    categoryLabel: 'Tech Spec',
    categoryIcon: BookOpen,
    tags: ['Angular', 'Signals', 'TypeScript'],
    pinned: true,
    lastVisited: 'Today'
  },
  {
    id: 102,
    title: 'GitHub REST & GraphQL API Reference',
    url: 'https://docs.github.com/en/rest',
    description: 'Official GitHub developer reference for repositories, user contributions, octokit SDK, and OAuth2 security.',
    category: 'specs',
    categoryLabel: 'Tech Spec',
    categoryIcon: BookOpen,
    tags: ['GitHub API', 'REST', 'GraphQL'],
    pinned: true,
    lastVisited: 'Yesterday'
  },
  {
    id: 103,
    title: 'GitHub GraphQL API Explorer',
    url: 'https://docs.github.com/en/graphql/overview/explorer',
    description: 'Interactive IDE to test and validate live GraphQL schema queries against real GitHub user repositories.',
    category: 'tools',
    categoryLabel: 'Dev Tool',
    categoryIcon: Globe,
    tags: ['GraphQL', 'API Explorer', 'Developer Tool'],
    pinned: true,
    lastVisited: '3d ago'
  }
];

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.css'
})
export class BookmarksComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly workspace = inject(WorkspaceDataService);
  readonly gitHubApi = inject(GitHubApiService);

  // 1. Khai báo Lucide Icons
  readonly Bookmark = Bookmark;
  readonly Search = Search;
  readonly ExternalLink = ExternalLink;
  readonly FolderGit2 = FolderGit2;
  readonly BookOpen = BookOpen;
  readonly Globe = Globe;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Star = Star;
  readonly Layers = Layers;
  readonly Sparkles = Sparkles;
  readonly Tag = Tag;
  readonly RefreshCw = RefreshCw;
  readonly X = X;
  readonly Check = Check;

  // 2. Signals quản lý trạng thái
  readonly selectedCategory = signal<BookmarkCategory>('all');
  readonly searchQuery = signal<string>('');
  readonly isSyncing = signal<boolean>(false);
  readonly pinnedIds = signal<Set<number>>(new Set([101, 102, 103]));

  // Modal thêm Bookmark mới
  readonly isAddModalOpen = signal<boolean>(false);
  readonly newTitle = signal<string>('');
  readonly newUrl = signal<string>('');
  readonly newCategory = signal<'specs' | 'tools' | 'repos'>('specs');
  readonly newDescription = signal<string>('');
  readonly newTags = signal<string>('');

  // 3. Custom Bookmarks (Specs, Tools, External Docs)
  readonly customBookmarks = signal<BookmarkItem[]>(DEFAULT_SPECS_AND_TOOLS);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredBookmarks();
    }

    if (this.gitHubApi.repositories().length === 0) {
      this.gitHubApi.fetchRepositories();
    }
  }

  private loadStoredBookmarks(): void {
    try {
      const rawPinned = localStorage.getItem(PINNED_BOOKMARKS_KEY);
      if (rawPinned) {
        this.pinnedIds.set(new Set(JSON.parse(rawPinned)));
      }

      const rawCustom = localStorage.getItem(CUSTOM_BOOKMARKS_KEY);
      if (rawCustom) {
        const parsed = JSON.parse(rawCustom);
        const restored = parsed.map((item: any) => ({
          ...item,
          categoryIcon: item.category === 'repos' ? FolderGit2 : (item.category === 'specs' ? BookOpen : Globe)
        }));
        this.customBookmarks.set(restored);
      }
    } catch {}
  }

  // 4. Danh sách Bookmarks từ Repositories thật được bookmark bởi user
  readonly bookmarkedProjects = computed<BookmarkItem[]>(() => {
    const pinned = this.pinnedIds();
    return this.workspace.projects()
      .filter(p => p.isBookmarked)
      .map(p => ({
        id: p.id,
        title: p.name,
        url: p.githubUrl,
        description: p.description,
        category: 'repos' as const,
        categoryLabel: 'Repository',
        categoryIcon: FolderGit2,
        tags: p.tags && p.tags.length ? p.tags : [p.language || 'Code', p.isPrivate ? 'Private' : 'Public'],
        pinned: pinned.has(p.id),
        lastVisited: p.lastCommitTime || 'Recently'
      }));
  });

  // Toàn bộ Bookmarks tổng hợp
  readonly allBookmarks = computed<BookmarkItem[]>(() => {
    const pinned = this.pinnedIds();
    const custom = this.customBookmarks().map(b => ({
      ...b,
      pinned: pinned.has(b.id)
    }));

    return [...this.bookmarkedProjects(), ...custom];
  });

  // Số lượng theo từng Category
  readonly reposCount = computed(() => this.bookmarkedProjects().length);
  readonly specsCount = computed(() => this.customBookmarks().filter(b => b.category === 'specs').length);
  readonly toolsCount = computed(() => this.customBookmarks().filter(b => b.category === 'tools').length);
  readonly pinnedCount = computed(() => this.allBookmarks().filter(b => b.pinned).length);

  // 5. Danh sách Bookmark lọc theo Tìm kiếm và Danh mục
  readonly filteredBookmarks = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.allBookmarks().filter(item => {
      const matchCat = cat === 'all' || item.category === cat;
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q));

      return matchCat && matchQuery;
    });
  });

  // Chuyển tab danh mục
  setCategory(cat: BookmarkCategory) {
    this.selectedCategory.set(cat);
  }

  // Toggle Pinned
  togglePin(id: number) {
    const current = new Set(this.pinnedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.pinnedIds.set(current);

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(PINNED_BOOKMARKS_KEY, JSON.stringify(Array.from(current)));
      } catch {}
    }
  }

  // Xóa bookmark
  removeBookmark(id: number) {
    const isRepo = this.workspace.projects().some(p => p.id === id);
    if (isRepo) {
      this.workspace.toggleBookmark(id);
    } else {
      this.customBookmarks.update(list => {
        const nextList = list.filter(b => b.id !== id);
        if (isPlatformBrowser(this.platformId)) {
          try {
            localStorage.setItem(CUSTOM_BOOKMARKS_KEY, JSON.stringify(nextList));
          } catch {}
        }
        return nextList;
      });
    }

    // Gỡ khỏi pinned nếu có
    if (this.pinnedIds().has(id)) {
      const current = new Set(this.pinnedIds());
      current.delete(id);
      this.pinnedIds.set(current);
      if (isPlatformBrowser(this.platformId)) {
        try {
          localStorage.setItem(PINNED_BOOKMARKS_KEY, JSON.stringify(Array.from(current)));
        } catch {}
      }
    }
  }

  // Modal methods
  openAddModal() {
    this.newTitle.set('');
    this.newUrl.set('');
    this.newCategory.set('specs');
    this.newDescription.set('');
    this.newTags.set('');
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
  }

  submitAddBookmark() {
    let title = this.newTitle().trim();
    let url = this.newUrl().trim();
    if (!title || !url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const cat = this.newCategory();
    const categoryLabels = {
      repos: 'Repository',
      specs: 'Tech Spec',
      tools: 'Dev Tool'
    };
    const categoryIcons = {
      repos: FolderGit2,
      specs: BookOpen,
      tools: Globe
    };

    const newItem: BookmarkItem = {
      id: Date.now(),
      title,
      url,
      description: this.newDescription().trim() || 'Saved developer bookmark.',
      category: cat,
      categoryLabel: categoryLabels[cat],
      categoryIcon: categoryIcons[cat],
      tags: this.newTags().split(',').map(t => t.trim()).filter(Boolean),
      pinned: true,
      lastVisited: 'Just now'
    };

    // Tự động ghim bookmark mới
    const currentPinned = new Set(this.pinnedIds());
    currentPinned.add(newItem.id);
    this.pinnedIds.set(currentPinned);

    this.customBookmarks.update(list => {
      const next = [newItem, ...list];
      if (isPlatformBrowser(this.platformId)) {
        try {
          localStorage.setItem(CUSTOM_BOOKMARKS_KEY, JSON.stringify(next));
          localStorage.setItem(PINNED_BOOKMARKS_KEY, JSON.stringify(Array.from(currentPinned)));
        } catch {}
      }
      return next;
    });

    this.closeAddModal();
  }

  // Sync lại dữ liệu từ GitHub
  async syncRepositories(): Promise<void> {
    this.isSyncing.set(true);
    try {
      await this.gitHubApi.fetchRepositories();
    } finally {
      this.isSyncing.set(false);
    }
  }
}
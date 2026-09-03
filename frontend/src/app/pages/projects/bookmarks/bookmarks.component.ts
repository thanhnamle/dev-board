import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  Tag
} from 'lucide-angular';

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

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.css'
})
export class BookmarksComponent {
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

  // 2. Signals quản lý trạng thái
  selectedCategory = signal<BookmarkCategory>('all');
  searchQuery = signal<string>('');

  // 3. Danh sách Bookmark mẫu
  bookmarksList = signal<BookmarkItem[]>([
    {
      id: 1,
      title: 'DevBoard Frontend App',
      url: 'https://github.com/payoo-devboard/frontend',
      description: 'Main client repository with Angular 17, Signals, and Linear Obsidian Dark Theme.',
      category: 'repos',
      categoryLabel: 'Repository',
      categoryIcon: FolderGit2,
      tags: ['Angular', 'Frontend', 'Production'],
      pinned: true,
      lastVisited: '10m ago'
    },
    {
      id: 2,
      title: 'Core API Gateway Microservice',
      url: 'https://github.com/payoo-devboard/core-api',
      description: 'High-throughput Golang backend gateway handling webhooks and GitHub event queues.',
      category: 'repos',
      categoryLabel: 'Repository',
      categoryIcon: FolderGit2,
      tags: ['Go', 'Backend', 'API Gateway'],
      pinned: true,
      lastVisited: '1h ago'
    },
    {
      id: 3,
      title: 'SSR Hydration Pipeline Architecture RFC',
      url: 'https://docs.payoo.vn/specs/ssr-pipeline',
      description: 'Technical RFC detailing Angular Universal hydration, state caching, and bundle chunking.',
      category: 'specs',
      categoryLabel: 'Tech Spec',
      categoryIcon: BookOpen,
      tags: ['Architecture', 'SSR', 'RFC'],
      pinned: true,
      lastVisited: 'Yesterday'
    },
    {
      id: 4,
      title: 'PostgreSQL Connection Pooling & SSL Guide',
      url: 'https://docs.payoo.vn/infra/postgres-pooling',
      description: 'Best practices for PgBouncer setup, SSL TLS 1.3 encryption, and failover replicas.',
      category: 'specs',
      categoryLabel: 'Tech Spec',
      categoryIcon: BookOpen,
      tags: ['Database', 'Postgres', 'Security'],
      pinned: false,
      lastVisited: '2d ago'
    },
    {
      id: 5,
      title: 'Vercel Production Deployment Dashboard',
      url: 'https://vercel.com/payoo/devboard',
      description: 'Live production builds, edge network cache status, and real-time serverless logs.',
      category: 'tools',
      categoryLabel: 'Dev Tool',
      categoryIcon: Globe,
      tags: ['Vercel', 'DevOps', 'Monitoring'],
      pinned: true,
      lastVisited: '3h ago'
    },
    {
      id: 6,
      title: 'Payment Integration SDK Repo',
      url: 'https://github.com/payoo-work/payment-sdk',
      description: 'Universal QR & IPN webhook signature validator SDK for fintech integrations.',
      category: 'repos',
      categoryLabel: 'Repository',
      categoryIcon: FolderGit2,
      tags: ['SDK', 'Fintech', 'Go'],
      pinned: false,
      lastVisited: '3d ago'
    },
    {
      id: 7,
      title: 'GitHub SSO Token Refresh Strategy Spec',
      url: 'https://docs.payoo.vn/security/github-sso',
      description: 'OAuth2.0 token rotation RFC with sliding sessions and encrypted cookie caching.',
      category: 'specs',
      categoryLabel: 'Tech Spec',
      categoryIcon: BookOpen,
      tags: ['Auth', 'OAuth2', 'Security'],
      pinned: false,
      lastVisited: '4d ago'
    },
    {
      id: 8,
      title: 'Figma DevBoard Design Tokens & UI Kit',
      url: 'https://figma.com/@payoo/devboard-ui',
      description: 'Design system tokens, Linear Dark Theme specs, and SVG iconography assets.',
      category: 'tools',
      categoryLabel: 'Dev Tool',
      categoryIcon: Globe,
      tags: ['Design', 'Figma', 'UI/UX'],
      pinned: false,
      lastVisited: '5d ago'
    }
  ]);

  // 4. Danh sách Bookmark lọc theo Tìm kiếm và Danh mục
  filteredBookmarks = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.bookmarksList().filter(item => {
      const matchCat = cat === 'all' || item.category === cat;
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
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
    this.bookmarksList.update(list =>
      list.map(b => (b.id === id ? { ...b, pinned: !b.pinned } : b))
    );
  }

  // Xóa bookmark
  removeBookmark(id: number) {
    this.bookmarksList.update(list => list.filter(b => b.id !== id));
  }
}
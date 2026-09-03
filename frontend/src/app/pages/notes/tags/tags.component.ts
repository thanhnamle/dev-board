import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Tag,
  Search,
  Plus,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  Hash
} from 'lucide-angular';

export interface TagMeta {
  name: string;
  count: number;
  color: string;
}

export interface TaggedNote {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  lastUpdated: string;
  tags: string[];
}

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.css'
})
export class TagsComponent {
  // 1. Khai báo Lucide Icons
  readonly Tag = Tag;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly BookOpen = BookOpen;
  readonly Layers = Layers;
  readonly Sparkles = Sparkles;
  readonly ArrowRight = ArrowRight;
  readonly FileText = FileText;
  readonly Clock = Clock;
  readonly Hash = Hash;

  // 2. Signals quản lý trạng thái
  selectedTag = signal<string>('All');
  searchQuery = signal<string>('');

  // 3. Danh sách các Topic Tags
  tagList: TagMeta[] = [
    { name: 'All', count: 19, color: '#6366f1' },
    { name: 'Architecture', count: 6, color: '#8b5cf6' },
    { name: 'Security', count: 5, color: '#10b981' },
    { name: 'Angular 17', count: 4, color: '#38bdf8' },
    { name: 'PostgreSQL', count: 3, color: '#a855f7' },
    { name: 'DevOps', count: 3, color: '#f59e0b' },
    { name: 'SSR', count: 2, color: '#38bdf8' },
    { name: 'OAuth2', count: 2, color: '#10b981' },
    { name: 'PgBouncer', count: 2, color: '#a855f7' },
    { name: 'K8s', count: 2, color: '#f43f5e' },
    { name: 'UI/UX', count: 2, color: '#ec4899' }
  ];

  // 4. Danh sách các bài viết mẫu
  taggedNotes = signal<TaggedNote[]>([
    {
      id: 1,
      title: 'DevBoard 2.0 SSR Pipeline & Hydration RFC',
      excerpt: 'Angular 17 non-destructive hydration implementation, TransferState caching, and edge routing.',
      category: 'Architecture',
      readTime: '4 min read',
      lastUpdated: 'Today at 09:15 AM',
      tags: ['Architecture', 'Angular 17', 'SSR', 'UI/UX']
    },
    {
      id: 2,
      title: 'PostgreSQL Connection Pooling & SSL Setup Guide',
      excerpt: 'PgBouncer setup in transaction mode with mutual TLS 1.3 encryption and failover replicas.',
      category: 'Infrastructure',
      readTime: '6 min read',
      lastUpdated: 'Yesterday at 04:30 PM',
      tags: ['PostgreSQL', 'PgBouncer', 'Security', 'DevOps']
    },
    {
      id: 3,
      title: 'GitHub SSO & Sliding Session Token Rotation',
      excerpt: 'OAuth 2.0 sliding refresh windows with encrypted HTTP-only cookie persistence.',
      category: 'Security',
      readTime: '5 min read',
      lastUpdated: '2 days ago',
      tags: ['Security', 'OAuth2', 'Architecture']
    },
    {
      id: 4,
      title: 'Kubernetes Production Cluster Disaster Recovery Runbook',
      excerpt: 'Step-by-step failover execution runbook for multi-region Kubernetes clusters.',
      category: 'Runbooks',
      readTime: '8 min read',
      lastUpdated: '3 days ago',
      tags: ['DevOps', 'K8s', 'Architecture']
    },
    {
      id: 5,
      title: 'Linear Obsidian Theme Design Tokens & CSS Architecture',
      excerpt: 'Design token specification for dual Dark/Light mode theme harmony using CSS Custom Properties.',
      category: 'Architecture',
      readTime: '3 min read',
      lastUpdated: '4 days ago',
      tags: ['Architecture', 'UI/UX', 'Angular 17']
    }
  ]);

  // 5. Lọc danh sách theo Tag và Ô tìm kiếm
  filteredNotes = computed(() => {
    const active = this.selectedTag();
    const q = this.searchQuery().toLowerCase().trim();

    return this.taggedNotes().filter(note => {
      const matchTag = active === 'All' || note.tags.includes(active);
      const matchQuery =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.excerpt.toLowerCase().includes(q) ||
        note.tags.some(t => t.toLowerCase().includes(q));

      return matchTag && matchQuery;
    });
  });

  // Chọn Tag
  selectTag(tagName: string) {
    this.selectedTag.set(tagName);
  }
}
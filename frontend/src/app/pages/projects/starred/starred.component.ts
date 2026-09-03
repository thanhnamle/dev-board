import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Star,
  Search,
  ExternalLink,
  GitBranch,
  GitCommit,
  Sparkles,
  Tag,
  ArrowUpDown,
  FolderGit2,
  CheckCircle2,
  Code2
} from 'lucide-angular';

export interface StarredProject {
  id: number;
  name: string;
  repoOwner: string;
  repoName: string;
  description: string;
  language: string;
  languageColor: string;
  versionTag: string;
  starsCount: number;
  tags: string[];
  branch: string;
  lastUpdated: string;
  githubUrl: string;
  isStarred: boolean;
}

@Component({
  selector: 'app-starred',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './starred.component.html',
  styleUrl: './starred.component.css'
})
export class StarredComponent {
  // 1. Khai báo Lucide Icons
  readonly Star = Star;
  readonly Search = Search;
  readonly ExternalLink = ExternalLink;
  readonly GitBranch = GitBranch;
  readonly GitCommit = GitCommit;
  readonly Sparkles = Sparkles;
  readonly Tag = Tag;
  readonly ArrowUpDown = ArrowUpDown;
  readonly FolderGit2 = FolderGit2;
  readonly CheckCircle2 = CheckCircle2;
  readonly Code2 = Code2;

  // 2. Signals quản lý trạng thái
  searchQuery = signal<string>('');
  sortBy = signal<'stars' | 'updated'>('stars');

  // 3. Danh sách Starred Projects
  starredList = signal<StarredProject[]>([
    {
      id: 1,
      name: 'Payment SDK & Webhook Core',
      repoOwner: 'payoo-work',
      repoName: 'payment-sdk',
      description: 'Universal QR-Code & HMAC webhook signature validation SDK for fintech integrations.',
      language: 'Go',
      languageColor: '#00add8',
      versionTag: 'v2.4.0',
      starsCount: 210,
      tags: ['SDK', 'Fintech', 'HMAC-SHA256', 'Go'],
      branch: 'main',
      lastUpdated: '1d ago',
      githubUrl: 'https://github.com',
      isStarred: true
    },
    {
      id: 2,
      name: 'DevBoard Frontend Client',
      repoOwner: 'payoo-devboard',
      repoName: 'frontend',
      description: 'High-performance engineering workspace dashboard built with Angular 17 and Signals.',
      language: 'TypeScript',
      languageColor: '#38bdf8',
      versionTag: 'v1.8.2',
      starsCount: 128,
      tags: ['Angular 17', 'Signals', 'Tailwind', 'SSR'],
      branch: 'main',
      lastUpdated: '15m ago',
      githubUrl: 'https://github.com',
      isStarred: true
    },
    {
      id: 3,
      name: 'Core API Gateway Service',
      repoOwner: 'payoo-devboard',
      repoName: 'core-api',
      description: 'Microservices reverse proxy and GitHub event ingestion stream written in Golang.',
      language: 'Go',
      languageColor: '#00add8',
      versionTag: 'v1.4.1',
      starsCount: 94,
      tags: ['Go 1.22', 'Gin', 'gRPC', 'Postgres'],
      branch: 'main',
      lastUpdated: '1h ago',
      githubUrl: 'https://github.com',
      isStarred: true
    },
    {
      id: 4,
      name: 'DevOps & Helm Chart Automation',
      repoOwner: 'payoo-devboard',
      repoName: 'infra-k8s',
      description: 'Terraform IaC and Kubernetes helm charts for automated GitHub Actions CI/CD.',
      language: 'Docker',
      languageColor: '#2496ed',
      versionTag: 'v3.1.0',
      starsCount: 67,
      tags: ['Kubernetes', 'Helm', 'CI/CD', 'Docker'],
      branch: 'staging',
      lastUpdated: '4d ago',
      githubUrl: 'https://github.com',
      isStarred: true
    },
    {
      id: 5,
      name: 'OAuth2 / SSO Authentication Hub',
      repoOwner: 'payoo-devboard',
      repoName: 'auth-service',
      description: 'Zero-trust authentication server with GitHub OAuth2 and Redis token caching.',
      language: 'TypeScript',
      languageColor: '#38bdf8',
      versionTag: 'v1.2.0',
      starsCount: 45,
      tags: ['OAuth2', 'JWT', 'Redis', 'Security'],
      branch: 'feature/oauth-refresh',
      lastUpdated: '3h ago',
      githubUrl: 'https://github.com',
      isStarred: true
    }
  ]);

  // 4. Lọc và Sắp xếp danh sách
  filteredList = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();

    let list = this.starredList().filter(item => {
      return (
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.repoName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    });

    if (sort === 'stars') {
      list = [...list].sort((a, b) => b.starsCount - a.starsCount);
    }

    return list;
  });

  // Toggle Unstar
  toggleStar(id: number) {
    this.starredList.update(list =>
      list.map(item => {
        if (item.id === id) {
          const nextState = !item.isStarred;
          return {
            ...item,
            isStarred: nextState,
            starsCount: nextState ? item.starsCount + 1 : item.starsCount - 1
          };
        }
        return item;
      })
    );
  }

  // Đổi kiểu sắp xếp
  setSortBy(sort: 'stars' | 'updated') {
    this.sortBy.set(sort);
  }
}
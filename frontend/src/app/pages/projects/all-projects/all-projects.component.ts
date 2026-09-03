import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FolderGit2,
  Search,
  Star,
  Bookmark,
  ExternalLink,
  GitBranch,
  GitCommit,
  Layers,
  Plus,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-angular';

export interface ProjectItem {
  id: number;
  name: string;
  repoName: string;
  description: string;
  language: string;
  languageColor: string;
  tags: string[];
  branch: string;
  lastCommit: string;
  lastCommitTime: string;
  deployStatus: 'production' | 'staging' | 'building';
  deployUrl?: string;
  githubUrl: string;
  starsCount: number;
  isStarred: boolean;
  isBookmarked: boolean;
}

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './all-projects.component.html',
  styleUrl: './all-projects.component.css'
})
export class AllProjectsComponent {
  // 1. Khai báo Lucide Icons
  readonly FolderGit2 = FolderGit2;
  readonly Search = Search;
  readonly Star = Star;
  readonly Bookmark = Bookmark;
  readonly ExternalLink = ExternalLink;
  readonly GitBranch = GitBranch;
  readonly GitCommit = GitCommit;
  readonly Layers = Layers;
  readonly Plus = Plus;
  readonly LayoutGrid = LayoutGrid;
  readonly List = List;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Sparkles = Sparkles;
  readonly ShieldCheck = ShieldCheck;

  // 2. Signals quản lý trạng thái
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal<string>('');
  selectedTech = signal<string>('All');

  // Danh sách công nghệ để lọc
  techFilters: string[] = ['All', 'Angular', 'TypeScript', 'Go', 'PostgreSQL', 'Docker'];

  // 3. Danh sách Projects mẫu
  projects = signal<ProjectItem[]>([
    {
      id: 1,
      name: 'DevBoard Frontend',
      repoName: 'payoo-devboard/frontend',
      description: 'Developer workspace hub and GitHub telemetry client built with Angular 17 and Signals.',
      language: 'TypeScript',
      languageColor: '#38bdf8',
      tags: ['Angular 17', 'Signals', 'Tailwind', 'SSR'],
      branch: 'main',
      lastCommit: 'feat(analytics): add commit velocity chart',
      lastCommitTime: '15m ago',
      deployStatus: 'production',
      deployUrl: 'https://devboard.payoo.vn',
      githubUrl: 'https://github.com',
      starsCount: 128,
      isStarred: true,
      isBookmarked: true
    },
    {
      id: 2,
      name: 'Core API Gateway',
      repoName: 'payoo-devboard/core-api',
      description: 'High-throughput microservices gateway and GitHub webhook processor in Golang.',
      language: 'Go',
      languageColor: '#00add8',
      tags: ['Go 1.22', 'Gin', 'gRPC', 'PostgreSQL'],
      branch: 'main',
      lastCommit: 'perf(webhook): optimize HMAC payload validation',
      lastCommitTime: '1h ago',
      deployStatus: 'production',
      deployUrl: 'https://api-devboard.payoo.vn',
      githubUrl: 'https://github.com',
      starsCount: 94,
      isStarred: true,
      isBookmarked: false
    },
    {
      id: 3,
      name: 'Authentication Service',
      repoName: 'payoo-devboard/auth-service',
      description: 'OAuth2 / OIDC token exchange and GitHub SSO refresh cycle management service.',
      language: 'TypeScript',
      languageColor: '#38bdf8',
      tags: ['NodeJS', 'OAuth2', 'JWT', 'Redis'],
      branch: 'feature/oauth-refresh',
      lastCommit: 'feat(auth): implement token rotation strategy',
      lastCommitTime: '3h ago',
      deployStatus: 'staging',
      deployUrl: 'https://staging-auth.payoo.vn',
      githubUrl: 'https://github.com',
      starsCount: 45,
      isStarred: false,
      isBookmarked: true
    },
    {
      id: 4,
      name: 'Payment SDK & Webhook',
      repoName: 'payoo-work/payment-sdk',
      description: 'Universal payment integration SDK supporting QR-Code, e-wallet, and instant IPN callbacks.',
      language: 'Go',
      languageColor: '#00add8',
      tags: ['Go', 'SDK', 'Fintech', 'HMAC-SHA256'],
      branch: 'main',
      lastCommit: 'refactor(sdk): simplify callback deserializer',
      lastCommitTime: '1d ago',
      deployStatus: 'production',
      githubUrl: 'https://github.com',
      starsCount: 210,
      isStarred: true,
      isBookmarked: true
    },
    {
      id: 5,
      name: 'Database Schema & Migrations',
      repoName: 'payoo-devboard/db-schema',
      description: 'PostgreSQL database DDL, schema migrations, and high-performance connection pool configs.',
      language: 'PostgreSQL',
      languageColor: '#a78bfa',
      tags: ['PostgreSQL', 'Prisma', 'Liquibase', 'SQL'],
      branch: 'main',
      lastCommit: 'chore(db): add index on github_events table',
      lastCommitTime: '2d ago',
      deployStatus: 'production',
      githubUrl: 'https://github.com',
      starsCount: 32,
      isStarred: false,
      isBookmarked: false
    },
    {
      id: 6,
      name: 'DevOps & Kubernetes Runbook',
      repoName: 'payoo-devboard/infra-k8s',
      description: 'Helm charts, Terraform IaC, Dockerfiles, and GitHub Actions CI/CD pipeline automation.',
      language: 'Docker',
      languageColor: '#2496ed',
      tags: ['Docker', 'Kubernetes', 'Helm', 'Terraform'],
      branch: 'staging',
      lastCommit: 'ci: update GitHub runner to ubuntu-latest',
      lastCommitTime: '4d ago',
      deployStatus: 'staging',
      githubUrl: 'https://github.com',
      starsCount: 67,
      isStarred: false,
      isBookmarked: false
    }
  ]);

  // Danh sách Project đã qua lọc tìm kiếm & Tech filter
  filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const tech = this.selectedTech();

    return this.projects().filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.repoName.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchTech = tech === 'All' || p.tags.some(t => t.toLowerCase().includes(tech.toLowerCase())) || p.language.toLowerCase().includes(tech.toLowerCase());
      return matchSearch && matchTech;
    });
  });

  // Toggle Star
  toggleStar(id: number) {
    this.projects.update(list =>
      list.map(p => {
        if (p.id === id) {
          return {
            ...p,
            isStarred: !p.isStarred,
            starsCount: p.isStarred ? p.starsCount - 1 : p.starsCount + 1
          };
        }
        return p;
      })
    );
  }

  // Toggle Bookmark
  toggleBookmark(id: number) {
    this.projects.update(list =>
      list.map(p => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
  }
}
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FolderGit2,
  GitFork,
  Star,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  GitBranch,
  Tag,
  LayoutGrid,
  List,
  SlidersHorizontal,
  CircleDot,
  Code2,
  BookOpen,
  Scale
} from 'lucide-angular';

export interface RepositoryItem {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  languageColor: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  isFork: boolean;
  isPrivate: boolean;
  license: string;
  tags: string[];
  htmlUrl: string;
  cloneUrl: string;
  updatedAt: string;
  updatedRelative: string;
  defaultBranch: string;
}

@Component({
  selector: 'app-repositories',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './repositories.component.html',
  styleUrl: './repositories.component.css'
})
export class RepositoriesComponent {
  // 1. Khai báo Lucide Icons
  readonly FolderGit2 = FolderGit2;
  readonly GitFork = GitFork;
  readonly Star = Star;
  readonly Search = Search;
  readonly ExternalLink = ExternalLink;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly RefreshCw = RefreshCw;
  readonly GitBranch = GitBranch;
  readonly Tag = Tag;
  readonly LayoutGrid = LayoutGrid;
  readonly List = List;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly CircleDot = CircleDot;
  readonly Code2 = Code2;
  readonly BookOpen = BookOpen;
  readonly Scale = Scale;

  // 2. Signals quản lý bộ lọc và trạng thái hiển thị
  searchQuery = signal<string>('');
  selectedType = signal<'all' | 'public' | 'forks'>('all');
  selectedLang = signal<string>('all');
  sortBy = signal<'updated' | 'stars' | 'forks' | 'name'>('updated');
  viewMode = signal<'grid' | 'list'>('grid');
  loading = signal<boolean>(false);
  copiedRepoId = signal<number | null>(null);

  // 3. Danh sách ngôn ngữ để lọc
  availableLanguages = [
    { label: 'All Languages', value: 'all' },
    { label: 'TypeScript', value: 'TypeScript' },
    { label: 'Go', value: 'Go' },
    { label: 'Python', value: 'Python' },
    { label: 'HTML/CSS', value: 'HTML' },
    { label: 'Docker', value: 'Dockerfile' }
  ];

  // 4. Danh sách 8 Repositories mẫu (Khớp với badge '8' ở Sidebar)
  repositories = signal<RepositoryItem[]>([
    {
      id: 1,
      name: 'dev-board',
      fullName: 'thanhnamle/dev-board',
      description: 'Modern developer workspace & internal tooling platform built with Angular 17, SSR, and Signals.',
      language: 'TypeScript',
      languageColor: '#3178c6',
      starsCount: 42,
      forksCount: 12,
      openIssuesCount: 3,
      isFork: false,
      isPrivate: false,
      license: 'MIT',
      tags: ['angular', 'angular17', 'signals', 'internal-tools', 'tailwind-css'],
      htmlUrl: 'https://github.com/thanhnamle/dev-board',
      cloneUrl: 'https://github.com/thanhnamle/dev-board.git',
      updatedAt: '2026-09-03T18:30:00Z',
      updatedRelative: 'Updated 2 hours ago',
      defaultBranch: 'main'
    },
    {
      id: 2,
      name: 'payment-gateway-sdk',
      fullName: 'thanhnamle/payment-gateway-sdk',
      description: 'Ultra high-throughput Go & Node.js SDK for secure QR processing, webhook verification and idempotency.',
      language: 'Go',
      languageColor: '#00add8',
      starsCount: 88,
      forksCount: 24,
      openIssuesCount: 1,
      isFork: false,
      isPrivate: false,
      license: 'Apache-2.0',
      tags: ['golang', 'payments', 'fintech', 'microservices', 'sdk'],
      htmlUrl: 'https://github.com/thanhnamle/payment-gateway-sdk',
      cloneUrl: 'https://github.com/thanhnamle/payment-gateway-sdk.git',
      updatedAt: '2026-09-02T10:15:00Z',
      updatedRelative: 'Updated 1 day ago',
      defaultBranch: 'master'
    },
    {
      id: 3,
      name: 'angular-signals-recipe',
      description: 'Enterprise architecture patterns, state management recipes, and debounced effects using Angular Signals.',
      language: 'TypeScript',
      languageColor: '#3178c6',
      fullName: 'thanhnamle/angular-signals-recipe',
      starsCount: 65,
      forksCount: 19,
      openIssuesCount: 0,
      isFork: false,
      isPrivate: false,
      license: 'MIT',
      tags: ['angular', 'signals', 'state-management', 'design-patterns'],
      htmlUrl: 'https://github.com/thanhnamle/angular-signals-recipe',
      cloneUrl: 'https://github.com/thanhnamle/angular-signals-recipe.git',
      updatedAt: '2026-08-31T14:20:00Z',
      updatedRelative: 'Updated 3 days ago',
      defaultBranch: 'main'
    },
    {
      id: 4,
      name: 'docker-dev-environments',
      fullName: 'thanhnamle/docker-dev-environments',
      description: 'Curated zero-config Docker Compose environments for local PostgreSQL, Redis cluster, Kafka, and MinIO.',
      language: 'Dockerfile',
      languageColor: '#384d54',
      starsCount: 31,
      forksCount: 7,
      openIssuesCount: 2,
      isFork: false,
      isPrivate: false,
      license: 'MIT',
      tags: ['docker', 'devops', 'compose', 'postgres', 'redis'],
      htmlUrl: 'https://github.com/thanhnamle/docker-dev-environments',
      cloneUrl: 'https://github.com/thanhnamle/docker-dev-environments.git',
      updatedAt: '2026-08-27T09:00:00Z',
      updatedRelative: 'Updated 1 week ago',
      defaultBranch: 'main'
    },
    {
      id: 5,
      name: 'cloud-infra-terraform',
      fullName: 'thanhnamle/cloud-infra-terraform',
      description: 'Production-ready AWS & GCP infrastructure modules with Kubernetes EKS, VPC peering, and Cloudflare WAF.',
      language: 'Go',
      languageColor: '#00add8',
      starsCount: 54,
      forksCount: 15,
      openIssuesCount: 4,
      isFork: false,
      isPrivate: false,
      license: 'Mozilla-2.0',
      tags: ['terraform', 'aws', 'kubernetes', 'cloud-native', 'security'],
      htmlUrl: 'https://github.com/thanhnamle/cloud-infra-terraform',
      cloneUrl: 'https://github.com/thanhnamle/cloud-infra-terraform.git',
      updatedAt: '2026-08-20T11:45:00Z',
      updatedRelative: 'Updated 2 weeks ago',
      defaultBranch: 'main'
    },
    {
      id: 6,
      name: 'event-driven-microservices',
      fullName: 'thanhnamle/event-driven-microservices',
      description: 'Distributed event sourcing template with RabbitMQ, Apache Kafka, gRPC, and outbox pattern implementation.',
      language: 'Go',
      languageColor: '#00add8',
      starsCount: 73,
      forksCount: 21,
      openIssuesCount: 1,
      isFork: false,
      isPrivate: false,
      license: 'MIT',
      tags: ['event-driven', 'kafka', 'rabbitmq', 'cqrs', 'golang'],
      htmlUrl: 'https://github.com/thanhnamle/event-driven-microservices',
      cloneUrl: 'https://github.com/thanhnamle/event-driven-microservices.git',
      updatedAt: '2026-08-15T16:00:00Z',
      updatedRelative: 'Updated 3 weeks ago',
      defaultBranch: 'main'
    },
    {
      id: 7,
      name: 'nestjs-graphql-starter',
      fullName: 'thanhnamle/nestjs-graphql-starter',
      description: 'Forked boilerplate for enterprise NestJS APIs with GraphQL code-first schema, Prisma ORM, and JWT guard.',
      language: 'TypeScript',
      languageColor: '#3178c6',
      starsCount: 18,
      forksCount: 5,
      openIssuesCount: 0,
      isFork: true,
      isPrivate: false,
      license: 'MIT',
      tags: ['nestjs', 'graphql', 'prisma', 'typescript', 'starter'],
      htmlUrl: 'https://github.com/thanhnamle/nestjs-graphql-starter',
      cloneUrl: 'https://github.com/thanhnamle/nestjs-graphql-starter.git',
      updatedAt: '2026-08-01T08:30:00Z',
      updatedRelative: 'Updated 1 month ago',
      defaultBranch: 'main'
    },
    {
      id: 8,
      name: 'ai-prompt-evaluator',
      fullName: 'thanhnamle/ai-prompt-evaluator',
      description: 'Python utility to benchmark and evaluate LLM prompt performance with token latency and output accuracy.',
      language: 'Python',
      languageColor: '#3572A5',
      starsCount: 39,
      forksCount: 8,
      openIssuesCount: 1,
      isFork: false,
      isPrivate: false,
      license: 'MIT',
      tags: ['python', 'llm', 'ai', 'benchmark', 'gemini'],
      htmlUrl: 'https://github.com/thanhnamle/ai-prompt-evaluator',
      cloneUrl: 'https://github.com/thanhnamle/ai-prompt-evaluator.git',
      updatedAt: '2026-07-25T13:10:00Z',
      updatedRelative: 'Updated 1 month ago',
      defaultBranch: 'main'
    }
  ]);

  // 5. Computed Signal: Tự động lọc & sắp xếp danh sách Repositories
  filteredRepos = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.selectedType();
    const lang = this.selectedLang();
    const sort = this.sortBy();

    return this.repositories()
      .filter(repo => {
        // Lọc theo search keyword (tên, mô tả, tags)
        const matchesQuery = !query || 
          repo.name.toLowerCase().includes(query) ||
          repo.description.toLowerCase().includes(query) ||
          repo.tags.some(t => t.toLowerCase().includes(query));

        // Lọc theo loại (all, public, forks)
        const matchesType = 
          type === 'all' || 
          (type === 'forks' && repo.isFork) || 
          (type === 'public' && !repo.isFork);

        // Lọc theo ngôn ngữ
        const matchesLang = lang === 'all' || repo.language.toLowerCase() === lang.toLowerCase();

        return matchesQuery && matchesType && matchesLang;
      })
      .sort((a, b) => {
        // Sắp xếp
        if (sort === 'stars') return b.starsCount - a.starsCount;
        if (sort === 'forks') return b.forksCount - a.forksCount;
        if (sort === 'name') return a.name.localeCompare(b.name);
        // Mặc định: theo thời gian cập nhật mới nhất
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  });

  // 6. Tính tổng số sao trên toàn bộ repos
  totalStars = computed(() => {
    return this.repositories().reduce((sum, r) => sum + r.starsCount, 0);
  });

  // 7. Tính tổng số forks
  totalForks = computed(() => {
    return this.repositories().reduce((sum, r) => sum + r.forksCount, 0);
  });

  // 8. Hàm 1-Click Copy git clone URL
  copyCloneUrl(repo: RepositoryItem, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    const cloneCmd = `git clone ${repo.cloneUrl}`;
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cloneCmd).then(() => {
        this.copiedRepoId.set(repo.id);
        setTimeout(() => this.copiedRepoId.set(null), 2000);
      });
    }
  }

  // 9. Hàm làm mới dữ liệu (hỗ trợ gọi live GitHub API nếu muốn)
  async syncRepositories() {
    this.loading.set(true);
    try {
      const res = await fetch('https://api.github.com/users/thanhnamle/repos?sort=updated&per_page=30');
      if (res.ok) {
        const data = await res.json();
        const mapped: RepositoryItem[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          description: r.description || 'No description provided.',
          language: r.language || 'Markdown',
          languageColor: this.getLanguageColor(r.language),
          starsCount: r.stargazers_count,
          forksCount: r.forks_count,
          openIssuesCount: r.open_issues_count,
          isFork: r.fork,
          isPrivate: r.private,
          license: r.license?.spdx_id || 'MIT',
          tags: r.topics?.length ? r.topics : ['repository', 'github'],
          htmlUrl: r.html_url,
          cloneUrl: r.clone_url,
          updatedAt: r.updated_at,
          updatedRelative: `Updated ${new Date(r.updated_at).toLocaleDateString()}`,
          defaultBranch: r.default_branch
        }));
        this.repositories.set(mapped);
      }
    } catch (err) {
      console.warn('Using local repositories cache:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private getLanguageColor(lang: string | null): string {
    const map: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Go: '#00add8',
      Python: '#3572A5',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Dockerfile: '#384d54',
      Shell: '#89e051'
    };
    return (lang && map[lang]) ? map[lang] : '#94a3b8';
  }
}
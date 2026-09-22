import { Component, signal, computed, inject, effect } from '@angular/core';
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
import { GitHubApiService } from '../../../core/services/github-api.service';

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
  readonly gitHubApiService = inject(GitHubApiService);

  ngOnInit() {
    this.repositories.set(this.gitHubApiService.repositories());
  }

  constructor() {
    effect(() => {
      this.repositories.set(this.gitHubApiService.repositories());
    });
  }

  // 2. Signals quản lý bộ lọc và trạng thái hiển thị
  searchQuery = signal<string>('');
  selectedType = signal<'all' | 'public' | 'forks'>('all');
  selectedLang = signal<string>('all');
  sortBy = signal<'updated' | 'stars' | 'forks' | 'name'>('updated');
  viewMode = signal<'grid' | 'list'>('grid');
  loading = signal<boolean>(false);
  copiedRepoId = signal<number | null>(null);

  repositories = signal<RepositoryItem[]>([]);

  // 3. Danh sách ngôn ngữ động tính từ Repositories
  availableLanguages = computed(() => {
    const langs = new Set<string>();
    for (const r of this.repositories()) {
      if (r.language) langs.add(r.language);
    }
    return [
      { label: 'All Languages', value: 'all' },
      ...Array.from(langs).sort().map(l => ({ label: l, value: l }))
    ];
  });

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

  sourceCount = computed(() => this.repositories().filter(r => !r.isFork).length);
  forkCount = computed(() => this.repositories().filter(r => r.isFork).length);
  totalOpenIssues = computed(() => this.repositories().reduce((sum, r) => sum + (r.openIssuesCount || 0), 0));
  topStarredRepo = computed(() => {
    const sorted = [...this.repositories()].sort((a, b) => b.starsCount - a.starsCount);
    return sorted.length ? sorted[0] : null;
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

  // 9. Hàm làm mới dữ liệu
  async syncRepositories() {
    this.loading.set(true);
    try {
      const realRepos = await this.gitHubApiService.fetchRepositories();
      this.repositories.set(realRepos);
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
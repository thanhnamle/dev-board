import { Component, signal, computed, inject, OnInit } from '@angular/core';
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
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Lock,
  Globe,
  GitFork
} from 'lucide-angular';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { GitHubApiService } from '../../../core/services/github-api.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './all-projects.component.html',
  styleUrl: './all-projects.component.css'
})
export class AllProjectsComponent implements OnInit {
  private readonly workspace = inject(WorkspaceDataService);
  private readonly route = inject(ActivatedRoute);
  readonly gitHubApiService = inject(GitHubApiService);

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
  readonly RotateCcw = RotateCcw;
  readonly RefreshCw = RefreshCw;
  readonly Lock = Lock;
  readonly Globe = Globe;
  readonly GitFork = GitFork;

  // 2. Signals quản lý hiển thị và tìm kiếm
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly searchQuery = signal<string>('');
  readonly selectedTech = signal<string>('All');
  readonly isSyncing = signal<boolean>(false);

  // 3. Danh sách Projects tự động đồng bộ 100% từ GitHub Repositories thật
  readonly projects = this.workspace.projects;

  // 4. Computed KPI Signals cho 3 thẻ đầu trang
  readonly totalProjects = computed(() => this.projects().length);

  readonly publicCount = computed(() =>
    this.projects().filter(p => !p.isPrivate).length
  );

  readonly privateCount = computed(() =>
    this.projects().filter(p => p.isPrivate).length
  );

  readonly totalStars = computed(() =>
    this.projects().reduce((sum, p) => sum + (p.starsCount || 0), 0)
  );

  readonly activeBranchesCount = computed(() => {
    const branches = new Set(this.projects().map(p => p.branch).filter(Boolean));
    return branches.size || 1;
  });

  // 5. Danh sách bộ lọc công nghệ động (lấy từ ngôn ngữ thực tế của các Repositories)
  readonly techFilters = computed<string[]>(() => {
    const counts: Record<string, number> = {};
    for (const p of this.projects()) {
      if (p.language && p.language !== 'Markdown') {
        counts[p.language] = (counts[p.language] || 0) + 1;
      }
    }
    const topTechs = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tech]) => tech);

    return ['All', ...topTechs];
  });

  // 6. Danh sách Project đã lọc theo từ khóa & công nghệ
  readonly filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const tech = this.selectedTech();

    return this.projects().filter(p => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.repoName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);

      const matchTech =
        tech === 'All' ||
        p.language.toLowerCase() === tech.toLowerCase() ||
        p.tags.some(t => t.toLowerCase() === tech.toLowerCase());

      return matchSearch && matchTech;
    });
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const projectId = Number(params.get('project'));
      if (projectId) {
        const project = this.projects().find(item => item.id === projectId);
        if (project) {
          this.selectedTech.set('All');
          this.searchQuery.set(project.name);
        }
      }
    });
  }

  ngOnInit(): void {
    // Tự động tải Repositories thật nếu chưa có trong bộ nhớ
    if (this.gitHubApiService.repositories().length === 0) {
      this.gitHubApiService.fetchRepositories();
    }
  }

  // Đặt lại bộ lọc về mặc định
  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedTech.set('All');
  }

  // Đồng bộ lại toàn bộ Repositories mới nhất từ GitHub API
  async syncRepositories(): Promise<void> {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      await this.gitHubApiService.fetchRepositories();
    } finally {
      this.isSyncing.set(false);
    }
  }

  // Mở trang tạo Repository mới trực tiếp trên GitHub
  createNewRepo(): void {
    window.open('https://github.com/new', '_blank');
  }

  // Bật/Tắt Star (lưu vĩnh viễn vào Workspace Service & LocalStorage)
  toggleStar(id: number): void {
    this.workspace.toggleStar(id);
  }

  // Bật/Tắt Bookmark (lưu vĩnh viễn vào Workspace Service & LocalStorage)
  toggleBookmark(id: number): void {
    this.workspace.toggleBookmark(id);
  }
}
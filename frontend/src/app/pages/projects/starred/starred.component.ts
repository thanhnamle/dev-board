import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  Code2,
  Lock,
  RefreshCw
} from 'lucide-angular';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { GitHubApiService } from '../../../core/services/github-api.service';

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
  updatedAt?: string;
  githubUrl: string;
  isStarred: boolean;
  isPrivate?: boolean;
}

@Component({
  selector: 'app-starred',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './starred.component.html',
  styleUrl: './starred.component.css'
})
export class StarredComponent implements OnInit {
  private readonly workspace = inject(WorkspaceDataService);
  readonly gitHubApi = inject(GitHubApiService);

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
  readonly Lock = Lock;
  readonly RefreshCw = RefreshCw;

  // 2. Signals quản lý trạng thái
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<'stars' | 'updated'>('stars');
  readonly selectedLang = signal<string>('All');
  readonly isSyncing = signal<boolean>(false);

  ngOnInit(): void {
    if (this.gitHubApi.repositories().length === 0) {
      this.gitHubApi.fetchRepositories();
    }
  }

  // 3. Danh sách Starred Projects lấy trực tiếp từ WorkspaceDataService (100% Real GitHub Repos)
  readonly starredList = computed<StarredProject[]>(() => {
    return this.workspace.projects()
      .filter(p => p.isStarred)
      .map(p => {
        const parts = (p.repoName || '').split('/');
        const owner = parts[0] || 'thanhnamle';
        const name = parts[1] || p.name;

        return {
          id: p.id,
          name: p.name,
          repoOwner: owner,
          repoName: name,
          description: p.description,
          language: p.language || 'Markdown',
          languageColor: p.languageColor || '#38bdf8',
          versionTag: p.isPrivate ? 'Private' : 'Public',
          starsCount: p.starsCount || 0,
          tags: p.tags && p.tags.length ? p.tags : [p.language || 'Code'],
          branch: p.branch || 'main',
          lastUpdated: p.lastCommitTime || 'Recently',
          updatedAt: p.updatedAt,
          githubUrl: p.githubUrl,
          isStarred: true,
          isPrivate: p.isPrivate
        };
      });
  });

  readonly totalStarsCount = computed(() =>
    this.starredList().reduce((sum, item) => sum + item.starsCount, 0)
  );

  readonly uniqueLanguagesCount = computed(() => {
    const langs = new Set(this.starredList().map(p => p.language).filter(Boolean));
    return langs.size;
  });

  readonly langFilters = computed<string[]>(() => {
    const langs = new Set<string>();
    for (const p of this.starredList()) {
      if (p.language && p.language !== 'Markdown') {
        langs.add(p.language);
      }
    }
    return ['All', ...Array.from(langs)];
  });

  // 4. Lọc và Sắp xếp danh sách
  readonly filteredList = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();
    const lang = this.selectedLang();

    let list = this.starredList().filter(item => {
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.repoName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q));

      const matchLang =
        lang === 'All' ||
        item.language.toLowerCase() === lang.toLowerCase();

      return matchSearch && matchLang;
    });

    if (sort === 'stars') {
      list = [...list].sort((a, b) => b.starsCount - a.starsCount);
    } else if (sort === 'updated') {
      list = [...list].sort(
        (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      );
    }

    return list;
  });

  // Toggle Unstar
  toggleStar(id: number) {
    this.workspace.toggleStar(id);
  }

  // Đổi kiểu sắp xếp
  setSortBy(sort: 'stars' | 'updated') {
    this.sortBy.set(sort);
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
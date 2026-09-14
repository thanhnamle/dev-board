import { Injectable, signal, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DEMO_NOTES, NoteItem } from '../data/notes';
import { ProjectItem } from '../data/projects';
import { DEMO_SNIPPETS, SnippetItem } from '../data/snippets';
import { GitHubApiService, GitHubRepoItem } from './github-api.service';

const BOOKMARKS_STORAGE_KEY = 'devboard_bookmarked_project_ids';
const STARRED_STORAGE_KEY = 'devboard_starred_project_ids';

@Injectable({ providedIn: 'root' })
export class WorkspaceDataService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly gitHubApi = inject(GitHubApiService);

  readonly projects = signal<ProjectItem[]>([]);
  readonly notes = signal<NoteItem[]>(DEMO_NOTES.map(note => ({ ...note, content: [...note.content], tags: [...note.tags] })));
  readonly snippets = signal<SnippetItem[]>(DEMO_SNIPPETS.map(snippet => ({ ...snippet, tags: [...snippet.tags] })));

  private bookmarkedIds = new Set<number>();
  private starredIds = new Set<number>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredPreferences();
    }

    // Tự động đồng bộ các Repositories thật từ GitHub vào projects
    effect(() => {
      const repos = this.gitHubApi.repositories();
      if (repos.length > 0) {
        this.syncFromGitHubRepos(repos);
      }
    }, { allowSignalWrites: true });
  }

  private loadStoredPreferences(): void {
    try {
      const rawBm = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (rawBm) this.bookmarkedIds = new Set(JSON.parse(rawBm));

      const rawSt = localStorage.getItem(STARRED_STORAGE_KEY);
      if (rawSt) this.starredIds = new Set(JSON.parse(rawSt));
    } catch {}
  }

  syncFromGitHubRepos(repos: GitHubRepoItem[]): void {
    if (isPlatformBrowser(this.platformId) && !localStorage.getItem('devboard_prefs_initialized')) {
      // Khởi tạo mặc định các repo nổi bật (dev-board, v.v.) trong lần đầu tiên
      const initialStarred = repos.filter(r => r.name === 'dev-board' || r.starsCount > 0).slice(0, 3);
      if (initialStarred.length === 0 && repos.length > 0) {
        initialStarred.push(repos[0]);
      }
      initialStarred.forEach(r => {
        this.starredIds.add(r.id);
        this.bookmarkedIds.add(r.id);
      });
      try {
        localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(Array.from(this.starredIds)));
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(this.bookmarkedIds)));
        localStorage.setItem('devboard_prefs_initialized', 'true');
      } catch {}
    }

    const mapped: ProjectItem[] = repos.map(r => ({
      id: r.id,
      name: r.name,
      repoName: r.fullName,
      description: r.description || 'GitHub project repository.',
      language: r.language || 'Markdown',
      languageColor: r.languageColor || '#38bdf8',
      tags: r.tags && r.tags.length ? r.tags : [r.language || 'Code', r.isPrivate ? 'Private' : 'Public'],
      branch: r.defaultBranch || 'main',
      lastCommit: r.updatedRelative || 'Updated recently',
      lastCommitTime: r.updatedRelative || 'Recently',
      deployStatus: r.name.toLowerCase().includes('microservice') || r.name.toLowerCase().includes('gateway')
        ? 'staging'
        : 'production',
      deployUrl: r.htmlUrl,
      githubUrl: r.htmlUrl,
      starsCount: r.starsCount + (this.starredIds.has(r.id) ? 1 : 0),
      forksCount: r.forksCount,
      isPrivate: r.isPrivate,
      isStarred: this.starredIds.has(r.id),
      isBookmarked: this.bookmarkedIds.has(r.id),
      updatedAt: r.updatedAt
    }));

    this.projects.set(mapped);
  }

  toggleStar(id: number): void {
    if (this.starredIds.has(id)) {
      this.starredIds.delete(id);
    } else {
      this.starredIds.add(id);
    }
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(Array.from(this.starredIds)));
      } catch {}
    }

    this.projects.update(list =>
      list.map(p => {
        if (p.id === id) {
          const isStarred = this.starredIds.has(id);
          return {
            ...p,
            isStarred,
            starsCount: isStarred ? p.starsCount + 1 : Math.max(0, p.starsCount - 1)
          };
        }
        return p;
      })
    );
  }

  toggleBookmark(id: number): void {
    if (this.bookmarkedIds.has(id)) {
      this.bookmarkedIds.delete(id);
    } else {
      this.bookmarkedIds.add(id);
    }
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(this.bookmarkedIds)));
      } catch {}
    }

    this.projects.update(list =>
      list.map(p => (p.id === id ? { ...p, isBookmarked: this.bookmarkedIds.has(id) } : p))
    );
  }
}

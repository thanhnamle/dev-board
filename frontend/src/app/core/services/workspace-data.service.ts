import { Injectable, signal, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DEMO_NOTES, NoteItem } from '../data/notes';
import { ProjectItem } from '../data/projects';
import { DEMO_SNIPPETS, SnippetItem } from '../data/snippets';
import { GitHubApiService, GitHubRepoItem } from './github-api.service';

const BOOKMARKS_STORAGE_KEY = 'devboard_bookmarked_project_ids';
const STARRED_STORAGE_KEY = 'devboard_starred_project_ids';
const NOTES_STORAGE_KEY = 'devboard_user_notes';
const SNIPPETS_STORAGE_KEY = 'devboard_user_snippets';

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

  private getStorageKey(baseKey: string): string {
    const login = this.gitHubApi.currentUser()?.login;
    return login ? `${baseKey}_${login}` : baseKey;
  }

  loadStoredPreferences(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const bmKey = this.getStorageKey(BOOKMARKS_STORAGE_KEY);
      const stKey = this.getStorageKey(STARRED_STORAGE_KEY);
      const rawBm = localStorage.getItem(bmKey);
      this.bookmarkedIds = rawBm ? new Set(JSON.parse(rawBm)) : new Set();

      const rawSt = localStorage.getItem(stKey);
      this.starredIds = rawSt ? new Set(JSON.parse(rawSt)) : new Set();

      const notesKey = this.getStorageKey(NOTES_STORAGE_KEY);
      const rawNotes = localStorage.getItem(notesKey);
      if (rawNotes) {
        this.notes.set(JSON.parse(rawNotes));
      }

      const snippetsKey = this.getStorageKey(SNIPPETS_STORAGE_KEY);
      const rawSnippets = localStorage.getItem(snippetsKey);
      if (rawSnippets) {
        this.snippets.set(JSON.parse(rawSnippets));
      }
    } catch {}
  }

  syncFromGitHubRepos(repos: GitHubRepoItem[]): void {
    this.loadStoredPreferences();
    const initKey = this.getStorageKey('devboard_prefs_initialized');

    if (isPlatformBrowser(this.platformId) && !localStorage.getItem(initKey)) {
      try {
        localStorage.setItem(initKey, 'true');
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
        localStorage.setItem(this.getStorageKey(STARRED_STORAGE_KEY), JSON.stringify(Array.from(this.starredIds)));
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
        localStorage.setItem(this.getStorageKey(BOOKMARKS_STORAGE_KEY), JSON.stringify(Array.from(this.bookmarkedIds)));
      } catch {}
    }

    this.projects.update(list =>
      list.map(p => (p.id === id ? { ...p, isBookmarked: this.bookmarkedIds.has(id) } : p))
    );
  }

  // ==========================================
  // NOTES CRUD
  // ==========================================
  private saveNotes(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.getStorageKey(NOTES_STORAGE_KEY), JSON.stringify(this.notes()));
      } catch {}
    }
  }

  addNote(data: { title: string; category: any; categoryLabel: string; excerpt: string; content: string[]; tags: string[] }): NoteItem {
    const wordCount = data.content.join(' ').split(/\s+/).filter(Boolean).length;
    const newNote: NoteItem = {
      id: Date.now(),
      title: data.title,
      category: data.category,
      categoryLabel: data.categoryLabel,
      excerpt: data.excerpt,
      content: data.content,
      readTime: `${Math.max(1, Math.ceil(wordCount / 200))} min read`,
      wordCount,
      lastUpdated: 'Just now',
      pinned: false,
      tags: data.tags
    };

    this.notes.update(list => [newNote, ...list]);
    this.saveNotes();
    return newNote;
  }

  updateNote(id: number, updates: Partial<NoteItem>): void {
    this.notes.update(list => list.map(n => {
      if (n.id === id) {
        const updated = { ...n, ...updates, lastUpdated: 'Just now' };
        if (updates.content) {
          const wordCount = updates.content.join(' ').split(/\s+/).filter(Boolean).length;
          updated.wordCount = wordCount;
          updated.readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
        }
        return updated;
      }
      return n;
    }));
    this.saveNotes();
  }

  deleteNote(id: number): void {
    this.notes.update(list => list.filter(n => n.id !== id));
    this.saveNotes();
  }

  togglePinNote(id: number): void {
    this.notes.update(list => list.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    this.saveNotes();
  }

  // ==========================================
  // SNIPPETS CRUD
  // ==========================================
  private saveSnippets(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.getStorageKey(SNIPPETS_STORAGE_KEY), JSON.stringify(this.snippets()));
      } catch {}
    }
  }

  addSnippet(data: { title: string; filename: string; language: string; languageLabel: string; description: string; rawCode: string; tags: string[] }): SnippetItem {
    const newSnippet: SnippetItem = {
      id: Date.now(),
      title: data.title,
      filename: data.filename,
      language: data.language,
      languageLabel: data.languageLabel,
      description: data.description,
      rawCode: data.rawCode,
      codeHtml: undefined,
      tags: data.tags,
      lastUsed: 'Just added',
      isFavorite: false
    };

    this.snippets.update(list => [newSnippet, ...list]);
    this.saveSnippets();
    return newSnippet;
  }

  updateSnippet(id: number, updates: Partial<SnippetItem>): void {
    this.snippets.update(list => list.map(s => s.id === id ? { ...s, ...updates } : s));
    this.saveSnippets();
  }

  deleteSnippet(id: number): void {
    this.snippets.update(list => list.filter(s => s.id !== id));
    this.saveSnippets();
  }

  toggleFavoriteSnippet(id: number): void {
    this.snippets.update(list => list.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
    this.saveSnippets();
  }

  reset(): void {
    this.bookmarkedIds.clear();
    this.starredIds.clear();
    this.projects.set([]);
  }
}

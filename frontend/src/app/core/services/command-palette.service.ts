import { computed, inject, Injectable, signal } from '@angular/core';
import { WorkspaceDataService } from './workspace-data.service';

export type CommandResultKind = 'Page' | 'Project' | 'Note' | 'Snippet';
export interface CommandResult {
  id: string;
  kind: CommandResultKind;
  title: string;
  description: string;
  path: string;
  queryParams?: Record<string, string | number>;
  keywords: string;
}

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly workspace = inject(WorkspaceDataService);
  readonly isOpen = signal(false);
  readonly query = signal('');

  private readonly pages: CommandResult[] = [
    ['overview', 'Dashboard overview', 'Daily tasks, pull requests and deployments', '/app/dashboard/overview', 'dashboard home tasks pull requests deployments'],
    ['analytics', 'Dashboard analytics', 'Velocity, commits and engineering health', '/app/dashboard/analytics', 'charts velocity commits health'],
    ['repositories', 'All repositories', 'Browse and manage your 21 GitHub repositories', '/app/projects/all-projects', 'repositories git repos projects'],
    ['bookmarks', 'Bookmarked repositories', 'Your personal quick-access focus workspace shelf', '/app/projects/bookmarks', 'bookmarks pinned active focus shelf'],
    ['starred', 'Starred repositories', 'Your favorited GitHub repositories', '/app/projects/starred', 'starred stars favorites'],
    ['github', 'GitHub profile', 'Profile, bio and 201 annual contributions', '/app/github/profile', 'github account profile bio stats'],
    ['activities', 'GitHub activities', 'Live commit timeline, PRs and recent activity', '/app/github/activities', 'activities timeline commits events log'],
    ['notes', 'All notes', 'Read technical notes and architectural RFCs', '/app/notes/all-notes', 'documents rfc notes write'],
    ['snippets', 'All snippets', 'Browse reusable code snippets and gists', '/app/snippets/all-snippets', 'code library snippets gists'],
    ['discussions', 'Discussions & Inbox', 'Community discussions, mentions and engineering updates', '/app/discussions', 'discussions inbox notifications messages threads']
  ].map(([id, title, description, path, keywords]) => ({ id: `page-${id}`, kind: 'Page', title, description, path, keywords } as CommandResult));

  readonly results = computed(() => {
    const projectResults = this.workspace.projects().map(project => ({
      id: `project-${project.id}`, kind: 'Project' as const, title: project.name,
      description: `${project.repoName} · ${project.language}`, path: '/app/projects/all-projects',
      queryParams: { project: project.id }, keywords: `${project.repoName} ${project.description} ${project.tags.join(' ')}`
    }));
    const noteResults = this.workspace.notes().map(note => ({
      id: `note-${note.id}`, kind: 'Note' as const, title: note.title,
      description: `${note.categoryLabel} · ${note.readTime}`, path: '/app/notes/all-notes',
      queryParams: { note: note.id }, keywords: `${note.excerpt} ${note.tags.join(' ')}`
    }));
    const snippetResults = this.workspace.snippets().map(snippet => ({
      id: `snippet-${snippet.id}`, kind: 'Snippet' as const, title: snippet.title,
      description: `${snippet.filename} · ${snippet.languageLabel}`, path: '/app/snippets/all-snippets',
      queryParams: { snippet: snippet.id }, keywords: `${snippet.filename} ${snippet.description} ${snippet.tags.join(' ')}`
    }));
    const all = [...this.pages, ...projectResults, ...noteResults, ...snippetResults];
    const terms = this.query().toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return all.slice(0, 12);
    return all.filter(item => {
      const searchable = `${item.title} ${item.description} ${item.keywords}`.toLocaleLowerCase();
      return terms.every(term => searchable.includes(term));
    }).slice(0, 20);
  });

  open() { this.query.set(''); this.isOpen.set(true); }
  close() { this.isOpen.set(false); this.query.set(''); }
}

import { Injectable, signal } from '@angular/core';
import { DEMO_NOTES, NoteItem } from '../data/notes';
import { DEMO_PROJECTS, ProjectItem } from '../data/projects';
import { DEMO_SNIPPETS, SnippetItem } from '../data/snippets';

@Injectable({ providedIn: 'root' })
export class WorkspaceDataService {
  readonly projects = signal<ProjectItem[]>(DEMO_PROJECTS.map(project => ({ ...project, tags: [...project.tags] })));
  readonly notes = signal<NoteItem[]>(DEMO_NOTES.map(note => ({ ...note, content: [...note.content], tags: [...note.tags] })));
  readonly snippets = signal<SnippetItem[]>(DEMO_SNIPPETS.map(snippet => ({ ...snippet, tags: [...snippet.tags] })));
}

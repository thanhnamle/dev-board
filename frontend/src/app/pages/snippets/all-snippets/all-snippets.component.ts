import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Code2,
  Search,
  Plus,
  Copy,
  Check,
  Tag,
  Clock,
  Sparkles,
  Layers,
  Terminal,
  Database,
  FileCode,
  ExternalLink,
  Heart,
  Trash2,
  X,
  Save
} from 'lucide-angular';

import { SnippetItem } from '../../../core/data/snippets';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
export type { SnippetItem } from '../../../core/data/snippets';

@Component({
  selector: 'app-all-snippets',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './all-snippets.component.html',
  styleUrl: './all-snippets.component.css'
})
export class AllSnippetsComponent {
  private readonly workspace = inject(WorkspaceDataService);
  private readonly route = inject(ActivatedRoute);

  // 1. Khai báo Lucide Icons
  readonly Code2 = Code2;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly Tag = Tag;
  readonly Clock = Clock;
  readonly Sparkles = Sparkles;
  readonly Layers = Layers;
  readonly Terminal = Terminal;
  readonly Database = Database;
  readonly FileCode = FileCode;
  readonly ExternalLink = ExternalLink;
  readonly Heart = Heart;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Save = Save;

  // 2. Signals quản lý trạng thái
  selectedLang = signal<string>('All');
  searchQuery = signal<string>('');
  copiedSnippetId = signal<number | null>(null);

  // Modal form signals
  isSnippetModalOpen = signal<boolean>(false);
  formTitle = signal<string>('');
  formFilename = signal<string>('');
  formLanguage = signal<string>('typescript');
  formTags = signal<string>('');
  formDesc = signal<string>('');
  formCode = signal<string>('');

  languagesList = computed(() => {
    const defaultLangs = ['All', 'TypeScript', 'Go', 'SQL', 'Docker', 'Shell', 'CSS'];
    const customLangs = this.snippets().map(s => s.languageLabel).filter(Boolean);
    const unique = Array.from(new Set([...defaultLangs, ...customLangs]));
    return unique.map(name => ({
      name,
      count: name === 'All' ? this.snippets().length : this.snippets().filter(snippet => snippet.languageLabel.toLowerCase() === name.toLowerCase()).length
    }));
  });
  languageCount = computed(() => new Set(this.snippets().map(snippet => snippet.language)).size);
  totalCodeLines = computed(() => this.snippets().reduce((sum, s) => sum + s.rawCode.split('\n').length, 0));

  // 3. Danh sách Snippets mẫu
  snippets = this.workspace.snippets;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const snippet = this.snippets().find(item => item.id === Number(params.get('snippet')));
      if (snippet) { this.selectedLang.set('All'); this.searchQuery.set(snippet.title); }
    });
  }

  // 4. Lọc danh sách Snippets
  filteredSnippets = computed(() => {
    const lang = this.selectedLang().toLowerCase();
    const q = this.searchQuery().toLowerCase().trim();

    return this.snippets().filter(s => {
      const matchLang = lang === 'all' || s.language === lang || s.languageLabel.toLowerCase() === lang;
      const matchQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.filename.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q));

      return matchLang && matchQuery;
    });
  });

  // Chọn ngôn ngữ
  selectLanguage(langName: string) {
    this.selectedLang.set(langName);
  }

  // 1-Click Copy vào Clipboard
  copyCode(snippet: SnippetItem) {
    navigator.clipboard.writeText(snippet.rawCode).then(() => {
      this.copiedSnippetId.set(snippet.id);
      setTimeout(() => {
        if (this.copiedSnippetId() === snippet.id) {
          this.copiedSnippetId.set(null);
        }
      }, 1500);
    });
  }

  // Favorite toggle
  toggleFavorite(snippet: SnippetItem, event: Event) {
    event.stopPropagation();
    this.workspace.toggleFavoriteSnippet(snippet.id);
  }

  // Delete snippet
  deleteSnippet(snippet: SnippetItem, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${snippet.title}"?`)) {
      this.workspace.deleteSnippet(snippet.id);
    }
  }

  // Modal Open / Close / Submit
  openCreateModal() {
    this.formTitle.set('');
    this.formFilename.set('');
    this.formLanguage.set('typescript');
    this.formTags.set('');
    this.formDesc.set('');
    this.formCode.set('');
    this.isSnippetModalOpen.set(true);
  }

  closeSnippetModal() {
    this.isSnippetModalOpen.set(false);
  }

  private getLangLabel(lang: string): string {
    const map: Record<string, string> = {
      typescript: 'TypeScript',
      go: 'Go',
      sql: 'SQL',
      docker: 'Docker',
      shell: 'Shell',
      css: 'CSS',
      python: 'Python',
      rust: 'Rust',
      javascript: 'JavaScript'
    };
    return map[lang.toLowerCase()] || lang.toUpperCase();
  }

  submitSnippet() {
    const title = this.formTitle().trim();
    const rawCode = this.formCode().trim();
    if (!title || !rawCode) return;

    const lang = this.formLanguage().toLowerCase();
    const languageLabel = this.getLangLabel(lang);
    const filename = this.formFilename().trim() || `snippet.${lang === 'typescript' ? 'ts' : lang}`;
    const description = this.formDesc().trim() || 'Custom user snippet';
    const rawTags = this.formTags().split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    const tags = rawTags.length > 0 ? rawTags : [lang, 'utility'];

    this.workspace.addSnippet({
      title,
      filename,
      language: lang,
      languageLabel,
      description,
      rawCode,
      tags
    });

    this.closeSnippetModal();
  }
}

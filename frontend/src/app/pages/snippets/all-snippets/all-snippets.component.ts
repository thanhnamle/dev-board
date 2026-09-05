import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  ExternalLink
} from 'lucide-angular';

import { SnippetItem } from '../../../core/data/snippets';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
export type { SnippetItem } from '../../../core/data/snippets';

@Component({
  selector: 'app-all-snippets',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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

  // 2. Signals quản lý trạng thái
  selectedLang = signal<string>('All');
  searchQuery = signal<string>('');
  copiedSnippetId = signal<number | null>(null);

  // Danh mục ngôn ngữ
  languagesList = computed(() => ['All', 'TypeScript', 'Go', 'SQL', 'Docker', 'Shell', 'CSS'].map(name => ({
    name,
    count: name === 'All' ? this.snippets().length : this.snippets().filter(snippet => snippet.languageLabel === name).length
  })));
  languageCount = computed(() => new Set(this.snippets().map(snippet => snippet.language)).size);

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
      const matchLang = lang === 'all' || s.language === lang;
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
}

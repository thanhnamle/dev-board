import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Heart,
  Code2,
  Search,
  Copy,
  Check,
  FileCode,
  Tag,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  X,
  Save
} from 'lucide-angular';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { SnippetItem } from '../../../core/data/snippets';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent {
  private readonly workspace = inject(WorkspaceDataService);

  // 1. Khai báo Lucide Icons
  readonly Heart = Heart;
  readonly Code2 = Code2;
  readonly Search = Search;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly FileCode = FileCode;
  readonly Tag = Tag;
  readonly Sparkles = Sparkles;
  readonly ExternalLink = ExternalLink;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Save = Save;

  // 2. Signals quản lý trạng thái
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

  // 3. Danh sách Snippets yêu thích từ WorkspaceDataService
  favoritesList = computed(() => this.workspace.snippets().filter(s => s.isFavorite));

  readonly languageCount = computed(() => new Set(this.favoritesList().map(s => s.language)).size);
  readonly uniqueLanguagesString = computed(() => {
    const list = Array.from(new Set(this.favoritesList().map(s => s.languageLabel || s.language)));
    return list.slice(0, 4).join(' • ') || 'None';
  });

  // 4. Lọc danh sách Favorites
  filteredFavorites = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.favoritesList().filter(s => {
      return (
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.filename.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  });

  // Toggle Favorite
  toggleFavorite(id: number) {
    this.workspace.toggleFavoriteSnippet(id);
  }

  // Delete Snippet
  deleteSnippet(id: number) {
    if (confirm('Are you sure you want to delete this snippet?')) {
      this.workspace.deleteSnippet(id);
    }
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

  // Modal actions
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
    const description = this.formDesc().trim() || 'Favorite user snippet';
    const rawTags = this.formTags().split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    const tags = rawTags.length > 0 ? rawTags : [lang, 'favorite'];

    const newSnippet = this.workspace.addSnippet({
      title,
      filename,
      language: lang,
      languageLabel,
      description,
      rawCode,
      tags
    });

    // Mark as favorite immediately
    this.workspace.toggleFavoriteSnippet(newSnippet.id);
    this.closeSnippetModal();
  }
}
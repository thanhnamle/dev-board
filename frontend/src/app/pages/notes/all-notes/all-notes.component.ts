import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  FileText,
  Search,
  Plus,
  Star,
  Clock,
  BookOpen,
  Copy,
  Check,
  Tag,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Layers,
  ShieldAlert,
  X,
  Save
} from 'lucide-angular';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { GitHubApiService } from '../../../core/services/github-api.service';
import { UserService } from '../../../core/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type NoteCategory = 'all' | 'architecture' | 'infrastructure' | 'security' | 'runbooks';
export type NoteItemCategory = 'architecture' | 'infrastructure' | 'security' | 'runbooks';

@Component({
  selector: 'app-all-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './all-notes.component.html',
  styleUrl: './all-notes.component.css'
})
export class AllNotesComponent {
  private readonly workspace = inject(WorkspaceDataService);
  private readonly gitHubApi = inject(GitHubApiService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);

  // 1. Khai báo Lucide Icons
  readonly FileText = FileText;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Star = Star;
  readonly Clock = Clock;
  readonly BookOpen = BookOpen;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly Tag = Tag;
  readonly Trash2 = Trash2;
  readonly Edit3 = Edit3;
  readonly ExternalLink = ExternalLink;
  readonly Sparkles = Sparkles;
  readonly Layers = Layers;
  readonly ShieldAlert = ShieldAlert;
  readonly X = X;
  readonly Save = Save;

  // 2. Signals quản lý trạng thái
  selectedCategory = signal<NoteCategory>('all');
  searchQuery = signal<string>('');
  selectedNoteId = signal<number>(1);
  copied = signal<boolean>(false);

  // Modal form signals
  isNoteModalOpen = signal<boolean>(false);
  modalMode = signal<'create' | 'edit'>('create');
  formTitle = signal<string>('');
  formCategory = signal<NoteItemCategory>('architecture');
  formExcerpt = signal<string>('');
  formTags = signal<string>('');
  formContent = signal<string>('');

  // 3. Danh sách Notes kỹ thuật
  notesList = this.workspace.notes;

  readonly authorName = computed(() => {
    const ghUser = this.gitHubApi.currentUser();
    if (ghUser?.name) return `${ghUser.name} (Lead Architect)`;
    if (ghUser?.login) return `@${ghUser.login} (Lead Architect)`;
    const appUser = this.userService.currentUser();
    if (appUser?.name && appUser.name !== 'Developer') return `${appUser.name} (${appUser.role || 'Member'})`;
    return 'Lead Architect';
  });

  // Dynamic metrics & counts
  readonly pinnedCount = computed(() => this.notesList().filter(n => n.pinned).length);
  readonly archCount = computed(() => this.notesList().filter(n => n.category === 'architecture').length);
  readonly infraCount = computed(() => this.notesList().filter(n => n.category === 'infrastructure').length);
  readonly secCount = computed(() => this.notesList().filter(n => n.category === 'security').length);
  readonly runbookCount = computed(() => this.notesList().filter(n => n.category === 'runbooks').length);
  readonly totalWords = computed(() => this.notesList().reduce((acc, n) => acc + (n.wordCount || 0), 0));
  readonly totalReadTime = computed(() => Math.ceil(this.totalWords() / 200));

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const note = this.notesList().find(item => item.id === Number(params.get('note')));
      if (note) { this.selectedCategory.set('all'); this.searchQuery.set(''); this.selectedNoteId.set(note.id); }
    });
  }

  // 4. Lọc danh sách Notes
  filteredNotes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.notesList().filter(note => {
      const matchCat = cat === 'all' || note.category === cat;
      const matchQuery =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.excerpt.toLowerCase().includes(q) ||
        note.tags.some(t => t.toLowerCase().includes(q));

      return matchCat && matchQuery;
    });
  });

  // Note đang được chọn để đọc / sửa
  activeNote = computed(() => {
    const id = this.selectedNoteId();
    return this.notesList().find(n => n.id === id) || this.notesList()[0];
  });

  // Đổi note đang xem
  selectNote(id: number) {
    this.selectedNoteId.set(id);
  }

  // Đổi danh mục
  setCategory(cat: NoteCategory) {
    this.selectedCategory.set(cat);
  }

  // Toggle Pin
  togglePin(id: number, event: Event) {
    event.stopPropagation();
    this.workspace.togglePinNote(id);
  }

  // Copy Markdown Content
  copyNoteContent() {
    const note = this.activeNote();
    if (!note) return;
    const fullText = `# ${note.title}\n\n` + note.content.join('\n\n');
    navigator.clipboard.writeText(fullText).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    });
  }

  // CRUD Modal handlers
  openCreateModal() {
    this.modalMode.set('create');
    this.formTitle.set('');
    this.formCategory.set('architecture');
    this.formExcerpt.set('');
    this.formTags.set('');
    this.formContent.set('');
    this.isNoteModalOpen.set(true);
  }

  openEditModal() {
    const note = this.activeNote();
    if (!note) return;
    this.modalMode.set('edit');
    this.formTitle.set(note.title);
    this.formCategory.set(note.category as NoteItemCategory);
    this.formExcerpt.set(note.excerpt);
    this.formTags.set(note.tags.join(', '));
    this.formContent.set(note.content.join('\n\n'));
    this.isNoteModalOpen.set(true);
  }

  closeNoteModal() {
    this.isNoteModalOpen.set(false);
  }

  private getCategoryLabel(cat: string): string {
    switch (cat) {
      case 'infrastructure': return 'Cloud Infrastructure';
      case 'security': return 'Security Policy';
      case 'runbooks': return 'Operations Runbook';
      default: return 'Architecture RFC';
    }
  }

  submitNote() {
    const title = this.formTitle().trim();
    if (!title) return;

    const rawContent = this.formContent().trim();
    const content = rawContent
      ? rawContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
      : ['No detailed documentation written yet.'];
    const excerpt = this.formExcerpt().trim() || content[0].slice(0, 140) + '...';
    const rawTags = this.formTags().split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    const tags = rawTags.length > 0 ? rawTags : ['docs', 'notes'];
    const cat = this.formCategory();
    const categoryLabel = this.getCategoryLabel(cat);

    if (this.modalMode() === 'create') {
      const created = this.workspace.addNote({
        title,
        category: cat,
        categoryLabel,
        excerpt,
        content,
        tags
      });
      this.selectedNoteId.set(created.id);
    } else {
      const current = this.activeNote();
      if (current) {
        this.workspace.updateNote(current.id, {
          title,
          category: cat,
          categoryLabel,
          excerpt,
          content,
          tags
        });
      }
    }
    this.closeNoteModal();
  }

  deleteActiveNote() {
    const current = this.activeNote();
    if (!current) return;
    if (confirm(`Are you sure you want to delete note "${current.title}"?`)) {
      this.workspace.deleteNote(current.id);
      const remaining = this.notesList();
      if (remaining.length > 0) {
        this.selectedNoteId.set(remaining[0].id);
      }
    }
  }
}

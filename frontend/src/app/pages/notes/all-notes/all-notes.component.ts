import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  ShieldAlert
} from 'lucide-angular';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type NoteCategory = 'all' | 'architecture' | 'infrastructure' | 'security' | 'runbooks';

@Component({
  selector: 'app-all-notes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './all-notes.component.html',
  styleUrl: './all-notes.component.css'
})
export class AllNotesComponent {
  private readonly workspace = inject(WorkspaceDataService);
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

  // 2. Signals quản lý trạng thái
  selectedCategory = signal<NoteCategory>('all');
  searchQuery = signal<string>('');
  selectedNoteId = signal<number>(1);
  copied = signal<boolean>(false);

  // 3. Danh sách Notes kỹ thuật
  notesList = this.workspace.notes;

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
    this.notesList.update(list =>
      list.map(n => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
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
}

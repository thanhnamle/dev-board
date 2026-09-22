import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import {
  LucideAngularModule,
  Tag,
  Search,
  Plus,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  Hash,
  X,
  Save
} from 'lucide-angular';

export interface TagMeta {
  name: string;
  count: number;
  color: string;
}

export interface TaggedNote {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  lastUpdated: string;
  tags: string[];
}

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.css'
})
export class TagsComponent {
  // 1. Khai báo Lucide Icons
  readonly Tag = Tag;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly BookOpen = BookOpen;
  readonly Layers = Layers;
  readonly Sparkles = Sparkles;
  readonly ArrowRight = ArrowRight;
  readonly FileText = FileText;
  readonly Clock = Clock;
  readonly Hash = Hash;
  readonly X = X;
  readonly Save = Save;

  private readonly workspace = inject(WorkspaceDataService);

  // 2. Signals quản lý trạng thái
  selectedTag = signal<string>('All');
  searchQuery = signal<string>('');

  // Modal Signals
  isTagModalOpen = signal<boolean>(false);
  newTagName = signal<string>('');
  noteTitle = signal<string>('');
  noteCategory = signal<string>('architecture');
  noteExcerpt = signal<string>('');

  readonly notes = this.workspace.notes;

  // 3. Danh sách các Topic Tags động từ Notes
  readonly tagList = computed<TagMeta[]>(() => {
    const notes = this.notes();
    const tagCounts: Record<string, number> = {};
    for (const n of notes) {
      for (const t of n.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    const colors = ['#8b5cf6', '#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#f43f5e', '#ec4899', '#6366f1'];
    const entries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    const items: TagMeta[] = [
      { name: 'All', count: notes.length, color: '#6366f1' },
      ...entries.map(([name, count], i) => ({
        name,
        count,
        color: colors[i % colors.length]
      }))
    ];
    return items;
  });

  // Top Category
  readonly topTag = computed<TagMeta>(() => {
    const list = this.tagList().filter(t => t.name !== 'All');
    return list.length ? list[0] : { name: 'Architecture', count: 0, color: '#8b5cf6' };
  });

  // 5. Lọc danh sách theo Tag và Ô tìm kiếm
  filteredNotes = computed(() => {
    const active = this.selectedTag();
    const q = this.searchQuery().toLowerCase().trim();

    return this.notes().filter(note => {
      const matchTag = active === 'All' || note.tags.includes(active);
      const matchQuery =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.excerpt.toLowerCase().includes(q) ||
        note.tags.some(t => t.toLowerCase().includes(q));

      return matchTag && matchQuery;
    });
  });

  // Chọn Tag
  selectTag(tagName: string) {
    this.selectedTag.set(tagName);
  }

  // Modal Open / Close / Submit
  openCreateModal() {
    this.newTagName.set('');
    this.noteTitle.set('');
    this.noteCategory.set('architecture');
    this.noteExcerpt.set('');
    this.isTagModalOpen.set(true);
  }

  closeTagModal() {
    this.isTagModalOpen.set(false);
  }

  submitTag() {
    const tagName = this.newTagName().trim().replace(/^#/, '');
    const title = this.noteTitle().trim();
    if (!tagName || !title) return;

    const cat = this.noteCategory();
    const catLabels: Record<string, string> = {
      architecture: 'Architecture RFC',
      infrastructure: 'Cloud Infrastructure',
      security: 'Security Policy',
      runbooks: 'Operations Runbook'
    };

    this.workspace.addNote({
      title,
      category: cat,
      categoryLabel: catLabels[cat] || 'Technical Spec',
      excerpt: this.noteExcerpt().trim() || `Technical note categorized under #${tagName}`,
      content: [`Documentation for topic #${tagName}.`],
      tags: [tagName]
    });

    this.selectedTag.set(tagName);
    this.closeTagModal();
  }
}
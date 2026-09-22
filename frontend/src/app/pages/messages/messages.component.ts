import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  MessageSquare,
  Plus,
  X,
  Send
} from 'lucide-angular';
import { MessageCategory, MessagesService } from '../../core/services/messages.service';
import { WorkspaceDataService } from '../../core/services/workspace-data.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent {
  readonly inbox = inject(MessagesService);
  private readonly workspace = inject(WorkspaceDataService);

  readonly MessageSquare = MessageSquare;
  readonly Plus = Plus;
  readonly X = X;
  readonly Send = Send;

  readonly categories: { id: MessageCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All discussions' }, { id: 'mentions', label: 'Mentions' },
    { id: 'reviews', label: 'Review requests' }, { id: 'system', label: 'System alerts' }
  ];
  readonly category = signal<MessageCategory | 'all'>('all');
  readonly query = signal('');
  readonly unreadOnly = signal(false);
  readonly selectedId = signal<number | null>(null);
  readonly drafts = signal<Record<number, string>>({});
  readonly snippetId = signal('');
  readonly snippets = this.workspace.snippets;
  readonly feedback = signal('');

  // Modal signals
  readonly isNewThreadModalOpen = signal<boolean>(false);
  readonly newTitle = signal<string>('');
  readonly newRepo = signal<string>('');
  readonly newCategory = signal<MessageCategory>('mentions');
  readonly newMessage = signal<string>('');

  readonly filteredThreads = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.inbox.threads().filter(thread =>
      (this.category() === 'all' || thread.category === this.category()) &&
      (!this.unreadOnly() || thread.unread) &&
      `${thread.title} ${thread.repository} ${thread.messages.map(message => message.body).join(' ')}`.toLowerCase().includes(query));
  });
  readonly selected = computed(() => this.inbox.threads().find(thread => thread.id === this.selectedId()));
  readonly draft = computed(() => this.drafts()[this.selectedId() ?? -1] ?? '');

  selectThread(id: number) {
    this.selectedId.set(id);
    this.inbox.markRead(id);
    this.snippetId.set('');
    this.feedback.set('');
  }

  updateDraft(body: string) {
    const id = this.selectedId();
    if (id !== null) this.drafts.update(drafts => ({ ...drafts, [id]: body }));
    this.feedback.set('');
  }

  attachSnippet() {
    const snippet = this.snippets().find(item => item.id === Number(this.snippetId()));
    if (!snippet) return;
    const body = `${this.draft()}\n\n\`\`\`${snippet.language}\n${snippet.rawCode}\n\`\`\``.trim();
    if (body.length > 10000) { this.feedback.set('Reply is limited to 10,000 characters.'); return; }
    this.updateDraft(body);
    this.snippetId.set('');
  }

  saveReply() {
    const id = this.selectedId();
    if (id !== null && this.inbox.addLocalReply(id, this.draft())) {
      this.updateDraft('');
      this.feedback.set('Reply added to this demo session. Nothing was sent to GitHub.');
    }
  }

  openNewThreadModal() {
    this.newTitle.set('');
    this.newRepo.set('');
    this.newCategory.set('mentions');
    this.newMessage.set('');
    this.isNewThreadModalOpen.set(true);
  }

  closeNewThreadModal() {
    this.isNewThreadModalOpen.set(false);
  }

  submitNewThread() {
    const title = this.newTitle().trim();
    const msg = this.newMessage().trim();
    if (!title || !msg) return;

    const thread = this.inbox.createThread(
      title,
      this.newRepo().trim() || 'workspace/discussions',
      this.newCategory(),
      msg
    );
    this.closeNewThreadModal();
    this.selectThread(thread.id);
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageCategory, MessagesService } from '../../core/services/messages.service';
import { WorkspaceDataService } from '../../core/services/workspace-data.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent {
  readonly inbox = inject(MessagesService);
  private readonly workspace = inject(WorkspaceDataService);
  readonly categories: { id: MessageCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All messages' }, { id: 'mentions', label: 'Mentions' },
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
}

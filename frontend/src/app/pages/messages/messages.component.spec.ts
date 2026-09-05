import { TestBed } from '@angular/core/testing';
import { MessagesComponent } from './messages.component';
import { MessagesService } from '../../core/services/messages.service';

describe('Messages Hub', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [MessagesComponent] }));

  it('updates the shared unread count when opening a thread and marking all read', () => {
    const component = TestBed.createComponent(MessagesComponent).componentInstance;
    const inbox = TestBed.inject(MessagesService);
    expect(inbox.unreadCount()).toBe(3);
    component.selectThread(1);
    expect(inbox.unreadCount()).toBe(2);
    component.selectThread(1);
    expect(inbox.unreadCount()).toBe(2);
    inbox.markAllRead();
    expect(inbox.unreadCount()).toBe(0);
  });

  it('combines category, case-insensitive search and unread filters', () => {
    const component = TestBed.createComponent(MessagesComponent).componentInstance;
    component.category.set('mentions');
    component.query.set('  DEVBOARD/FRONTEND  ');
    component.unreadOnly.set(true);
    expect(component.filteredThreads().map(thread => thread.id)).toEqual([1]);
    component.selectThread(1);
    expect(component.filteredThreads()).toEqual([]);
    expect(component.selected()?.id).toBe(1);
  });

  it('keeps drafts in their thread and appends the selected snippet as plain code', () => {
    const component = TestBed.createComponent(MessagesComponent).componentInstance;
    component.selectThread(1);
    component.updateDraft('First thread');
    component.selectThread(2);
    expect(component.draft()).toBe('');
    component.updateDraft('Second thread');
    component.selectThread(1);
    expect(component.draft()).toBe('First thread');
    component.snippetId.set(String(component.snippets()[0].id));
    component.attachSnippet();
    expect(component.draft()).toContain(component.snippets()[0].rawCode);
    component.saveReply();
    expect(component.selected()?.messages[1].local).toBeTrue();
    expect(component.draft()).toBe('');
    component.selectThread(2);
    expect(component.draft()).toBe('Second thread');
    expect(component.selected()?.messages.length).toBe(1);
  });

  it('rejects empty, oversized, unknown-thread and system replies', () => {
    const inbox = TestBed.inject(MessagesService);
    expect(inbox.addLocalReply(1, '  ')).toBeFalse();
    expect(inbox.addLocalReply(1, 'x'.repeat(10001))).toBeFalse();
    expect(inbox.addLocalReply(999, 'Hello')).toBeFalse();
    expect(inbox.addLocalReply(3, 'Hello')).toBeFalse();
    expect(inbox.threads().every(thread => thread.messages.length === 1)).toBeTrue();
  });

  it('renders a selected conversation and saves a reply through the form', async () => {
    const fixture = TestBed.createComponent(MessagesComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    (element.querySelector('.thread') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = '<script>alert("demo")</script>';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.message').length).toBe(2);
    expect(element.querySelector('.conversation script')).toBeNull();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Nothing was sent to GitHub');
  });
});

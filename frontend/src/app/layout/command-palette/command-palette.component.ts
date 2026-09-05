import { Component, ElementRef, HostListener, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Search, LucideAngularModule } from 'lucide-angular';
import { CommandPaletteService, CommandResult } from '../../core/services/command-palette.service';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css'
})
export class CommandPaletteComponent {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('paletteRoot') paletteRoot?: ElementRef<HTMLElement>;
  readonly Search = Search;
  readonly palette = inject(CommandPaletteService);
  private readonly router = inject(Router);
  readonly activeIndex = signal(0);
  readonly activeResult = computed(() => this.palette.results()[this.activeIndex()]);
  readonly activeDescendant = computed(() => {
    const result = this.activeResult();
    return result ? `command-${result.id}` : null;
  });
  private returnFocus?: HTMLElement;

  constructor() {
    effect(() => {
      if (this.palette.isOpen() && typeof document !== 'undefined') {
        this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
        setTimeout(() => this.searchInput?.nativeElement.focus());
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault();
      this.palette.isOpen() ? this.close() : this.palette.open();
      return;
    }
    if (!this.palette.isOpen()) return;
    if (event.key === 'Escape') { event.preventDefault(); this.close(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); this.move(1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); this.move(-1); }
    if (event.key === 'Enter') {
      const result = this.activeResult();
      if (result) { event.preventDefault(); this.run(result); }
    }
    if (event.key === 'Tab') this.keepFocusInside(event);
  }

  updateQuery(value: string) { this.palette.query.set(value); this.activeIndex.set(0); }
  move(direction: number) {
    const length = this.palette.results().length;
    if (length) {
      this.activeIndex.update(index => (index + direction + length) % length);
      setTimeout(() => document.getElementById(`command-${this.activeResult()?.id}`)?.scrollIntoView({ block: 'nearest' }));
    }
  }
  private keepFocusInside(event: KeyboardEvent) {
    const controls = Array.from(this.paletteRoot?.nativeElement.querySelectorAll<HTMLElement>('input, button') ?? []);
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  run(result: CommandResult) {
    this.router.navigate([result.path], { queryParams: result.queryParams });
    this.close(false);
  }
  close(restoreFocus = true) {
    this.palette.close();
    this.activeIndex.set(0);
    if (restoreFocus) setTimeout(() => this.returnFocus?.focus());
  }
}

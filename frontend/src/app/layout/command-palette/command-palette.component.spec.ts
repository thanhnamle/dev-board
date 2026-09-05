import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { WorkspaceDataService } from '../../core/services/workspace-data.service';

describe('CommandPaletteComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [CommandPaletteComponent],
    providers: [provideRouter([])]
  }));

  it('indexes pages and every shared workspace record', () => {
    const palette = TestBed.inject(CommandPaletteService);
    const workspace = TestBed.inject(WorkspaceDataService);
    palette.query.set('');
    expect(palette.results().length).toBe(12);
    palette.query.set('HMAC webhook');
    expect(palette.results().some(item => item.kind === 'Snippet')).toBeTrue();
    palette.query.set('text that cannot match');
    expect(palette.results()).toEqual([]);
    expect(workspace.projects().length).toBe(6);
    expect(workspace.notes().length).toBe(5);
    expect(workspace.snippets().length).toBe(4);
  });

  it('opens with Cmd/Ctrl+K, wraps arrow navigation and closes with Escape', fakeAsync(() => {
    const fixture = TestBed.createComponent(CommandPaletteComponent);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    fixture.detectChanges(); tick();
    const component = fixture.componentInstance;
    expect(component.palette.isOpen()).toBeTrue();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); tick();
    expect(component.activeIndex()).toBe(component.palette.results().length - 1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); tick();
    expect(component.palette.isOpen()).toBeFalse();
  }));

  it('navigates to the selected record with its query parameter', fakeAsync(() => {
    const fixture = TestBed.createComponent(CommandPaletteComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    component.palette.open();
    component.updateQuery('DevBoard Frontend');
    const project = component.palette.results().find(item => item.kind === 'Project');
    expect(project).toBeDefined();
    component.run(project!); tick();
    expect(router.navigate).toHaveBeenCalledWith(['/app/projects/all-projects'], { queryParams: { project: 1 } });
    expect(component.palette.isOpen()).toBeFalse();
  }));
});

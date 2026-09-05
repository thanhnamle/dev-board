import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FolderGit2,
  Search,
  Star,
  Bookmark,
  ExternalLink,
  GitBranch,
  GitCommit,
  Layers,
  Plus,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-angular';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './all-projects.component.html',
  styleUrl: './all-projects.component.css'
})
export class AllProjectsComponent {
  private readonly workspace = inject(WorkspaceDataService);
  private readonly route = inject(ActivatedRoute);
  // 1. Khai báo Lucide Icons
  readonly FolderGit2 = FolderGit2;
  readonly Search = Search;
  readonly Star = Star;
  readonly Bookmark = Bookmark;
  readonly ExternalLink = ExternalLink;
  readonly GitBranch = GitBranch;
  readonly GitCommit = GitCommit;
  readonly Layers = Layers;
  readonly Plus = Plus;
  readonly LayoutGrid = LayoutGrid;
  readonly List = List;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Sparkles = Sparkles;
  readonly ShieldCheck = ShieldCheck;

  // 2. Signals quản lý trạng thái
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal<string>('');
  selectedTech = signal<string>('All');

  // Danh sách công nghệ để lọc
  techFilters: string[] = ['All', 'Angular', 'TypeScript', 'Go', 'PostgreSQL', 'Docker'];

  // 3. Danh sách Projects mẫu
  projects = this.workspace.projects;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const project = this.projects().find(item => item.id === Number(params.get('project')));
      if (project) { this.selectedTech.set('All'); this.searchQuery.set(project.name); }
    });
  }

  // Danh sách Project đã qua lọc tìm kiếm & Tech filter
  filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const tech = this.selectedTech();

    return this.projects().filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.repoName.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchTech = tech === 'All' || p.tags.some(t => t.toLowerCase().includes(tech.toLowerCase())) || p.language.toLowerCase().includes(tech.toLowerCase());
      return matchSearch && matchTech;
    });
  });

  // Toggle Star
  toggleStar(id: number) {
    this.projects.update(list =>
      list.map(p => {
        if (p.id === id) {
          return {
            ...p,
            isStarred: !p.isStarred,
            starsCount: p.isStarred ? p.starsCount - 1 : p.starsCount + 1
          };
        }
        return p;
      })
    );
  }

  // Toggle Bookmark
  toggleBookmark(id: number) {
    this.projects.update(list =>
      list.map(p => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
  }
}

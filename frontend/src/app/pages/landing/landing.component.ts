import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BarChart2,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Code,
  ExternalLink,
  FileText,
  FolderGit2,
  GitBranch,
  Github,
  Globe,
  Key,
  Layers,
  LucideAngularModule,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  User,
  Zap
} from 'lucide-angular';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  readonly Github = Github;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Code = Code;
  readonly GitBranch = GitBranch;
  readonly ShieldCheck = ShieldCheck;
  readonly Terminal = Terminal;
  readonly Sparkles = Sparkles;
  readonly CheckCircle2 = CheckCircle2;
  readonly BookOpen = BookOpen;
  readonly FileText = FileText;
  readonly Layers = Layers;
  readonly Zap = Zap;
  readonly ExternalLink = ExternalLink;
  readonly User = User;
  readonly Mail = Mail;
  readonly Globe = Globe;
  readonly Bookmark = Bookmark;
  readonly BarChart2 = BarChart2;
  readonly FolderGit2 = FolderGit2;
  readonly Key = Key;

  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  userRole = signal<string>('');

  continueWithGitHub(): void {
    if (this.userRole()) {
      this.userService.setUserRole(this.userRole());
    }
    this.router.navigate(['/app/dashboard/overview']);
  }

  // Quản lý mục đang được chọn ở Sidebar (Home, Features, About Us, Docs)
  currentSection = signal<'home' | 'features' | 'about' | 'docs'>('home');

  // Quản lý trạng thái Dark/Light mode
  isDarkMode = signal<boolean>(true);

  // Tab đang chọn trong Code Snippet Preview (Bento Card lớn)
  activeTab = signal<'snippet' | 'config'>('snippet');

  // Tab đang chọn trong Docs Section
  activeDocsTab = signal<'quickstart' | 'oauth' | 'shortcuts' | 'architecture'>('quickstart');

  setSection(section: 'home' | 'features' | 'about' | 'docs'): void {
    this.currentSection.set(section);
  }

  toggleTheme(): void {
    this.isDarkMode.update(dark => !dark);
  }

  setTab(tab: 'snippet' | 'config'): void {
    this.activeTab.set(tab);
  }

  setDocsTab(tab: 'quickstart' | 'oauth' | 'shortcuts' | 'architecture'): void {
    this.activeDocsTab.set(tab);
  }
}







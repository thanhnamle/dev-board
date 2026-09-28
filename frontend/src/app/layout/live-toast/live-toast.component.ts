import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  GitCommit,
  GitPullRequest,
  Star,
  AlertCircle,
  Radio,
  X,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-angular';
import { TelemetryService, LiveToastItem } from '../../core/services/telemetry.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-live-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './live-toast.component.html',
  styleUrls: ['./live-toast.component.css'],
})
export class LiveToastComponent {
  readonly telemetry = inject(TelemetryService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  // Lucide icons
  readonly GitCommit = GitCommit;
  readonly GitPullRequest = GitPullRequest;
  readonly Star = Star;
  readonly AlertCircle = AlertCircle;
  readonly Radio = Radio;
  readonly X = X;
  readonly ExternalLink = ExternalLink;
  readonly CheckCircle2 = CheckCircle2;
  readonly Sparkles = Sparkles;

  dismiss(id: string) {
    this.telemetry.dismissToast(id);
  }

  viewWorkspace(toast: LiveToastItem) {
    this.telemetry.dismissToast(toast.id);
    this.router.navigate(['/app/projects/workspace']);
  }
}

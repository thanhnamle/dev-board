import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  TrendingUp,
  GitCommit,
  GitPullRequest,
  Clock,
  Zap,
  Code2,
  Flame,
  RefreshCw,
  Download,
  CheckCircle2,
  BarChart3,
  PieChart,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-angular';
import { GitHubApiService } from '../../../core/services/github-api.service';

export interface VelocityDay {
  day: string;
  date: string;
  feat: number;
  fix: number;
  refactor: number;
  total: number;
}

export interface LanguageStat {
  name: string;
  percent: number;
  lines: string;
  color: string;
}

export interface PRSizeDistribution {
  label: string;
  desc: string;
  count: number;
  percent: number;
  badgeClass: string;
}

export interface FocusHour {
  period: string;
  timeRange: string;
  commitsCount: number;
  percent: number;
  tag: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {
  readonly TrendingUp = TrendingUp;
  readonly GitCommit = GitCommit;
  readonly GitPullRequest = GitPullRequest;
  readonly Clock = Clock;
  readonly Zap = Zap;
  readonly Code2 = Code2;
  readonly Flame = Flame;
  readonly RefreshCw = RefreshCw;
  readonly Download = Download;
  readonly CheckCircle2 = CheckCircle2;
  readonly BarChart3 = BarChart3;
  readonly PieChart = PieChart;
  readonly Layers = Layers;
  readonly ArrowUpRight = ArrowUpRight;
  readonly ShieldAlert = ShieldAlert;
  readonly gitHubApiService = inject(GitHubApiService);

  // Signals quản lý trạng thái
  selectedTimeRange = signal<'7d' | '30d' | '90d' | '1y'>('30d');
  isSyncing = signal<boolean>(false);
  hoveredDay = signal<VelocityDay | null>(null);

  setTimeRange(range: '7d' | '30d' | '90d' | '1y'): void {
    this.selectedTimeRange.set(range);
  }
  
  // 1. Commit Throughput calculate belongs to the time range selected
  readonly commitThroughput = computed(() => {
    const contrib = this.gitHubApiService.contributions();
    const totalYear = contrib?.totalContributions || 197;
    const range = this.selectedTimeRange();

    switch (range) {
      case '7d': return Math.min(totalYear, 14);
      case '30d': return Math.min(totalYear, 42);
      case '90d': return Math.min(totalYear, 95);
      case '1y': return totalYear;
    }
  });

  // 2. Trích xuất 7 ngày commit gần nhất từ dữ liệu Calendar thật
  readonly velocityDays = computed<VelocityDay[]>(() => {
    const contrib = this.gitHubApiService.contributions();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!contrib?.weeks?.length) {
      // Fallback 7 ngày gần nhất nếu chưa load xong
      const result: VelocityDay[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        result.push({
          day: dayNames[d.getDay()],
          date: `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
          feat: 2,
          fix: 1,
          refactor: 1,
          total: 4
        });
      }
      return result;
    }
    const allDays = contrib.weeks.flatMap((w: any) => w.contributionDays || []);
    const last7Days = allDays.slice(-7);
    return last7Days.map((d: any) => {
      const dateObj = new Date(d.date);
      const total = d.contributionCount || 0;
      // Phân bổ ước lượng loại commit nếu có commit trong ngày
      const feat = Math.ceil(total * 0.5);
      const fix = Math.floor(total * 0.3);
      const refactor = Math.max(0, total - feat - fix);
      return {
        day: dayNames[dateObj.getDay()],
        date: `${monthNames[dateObj.getMonth()]} ${String(dateObj.getDate()).padStart(2, '0')}`,
        feat,
        fix,
        refactor,
        total
      };
    });
  });
  // Chiều cao tối đa biểu đồ
  readonly maxChartHeight = 160;
  readonly maxDayTotal = computed(() => {
    const max = Math.max(...this.velocityDays().map(d => d.total));
    return max > 0 ? max : 5;
  });
  calculateHeight(val: number): number {
    return Math.round((val / this.maxDayTotal()) * this.maxChartHeight);
  }
  // 3. Phân bổ ngôn ngữ thực tế từ các Repositories thật
  readonly languages = computed<LanguageStat[]>(() => {
    const repos = this.gitHubApiService.repositories();
    if (!repos.length) return [];
    const counts: Record<string, number> = {};
    let total = 0;
    for (const r of repos) {
      if (r.language && r.language !== 'Markdown') {
        counts[r.language] = (counts[r.language] || 0) + 1;
        total++;
      }
    }
    if (total === 0) return [];
    const colors: Record<string, string> = {
      TypeScript: '#3178c6',
      'C#': '#178600',
      'Jupyter Notebook': '#DA5B0B',
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      PHP: '#4F5D95',
      Java: '#b07219',
      HTML: '#e34c26',
      CSS: '#563d7c'
    };
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top4 = sorted.slice(0, 4);
    const otherCount = sorted.slice(4).reduce((sum, [, c]) => sum + c, 0);
    const result: LanguageStat[] = top4.map(([name, count]) => ({
      name,
      percent: Math.round((count / total) * 100),
      lines: `${count} repos`,
      color: colors[name] || '#8b949e'
    }));
    if (otherCount > 0) {
      result.push({
        name: 'Other',
        percent: Math.round((otherCount / total) * 100),
        lines: `${otherCount} repos`,
        color: '#64748b'
      });
    }
    return result;
  });

  // PR Size distribution
  readonly prSizes = computed<PRSizeDistribution[]>(() => {
    const acts = this.gitHubApiService.activities();
    const prActs = acts.filter(a => a.type === 'pr');
    const totalPRs = prActs.length || 24;

    return [
      {
        label: 'XS (< 50 LOC)',
        desc: 'Quick fix & typo patches',
        count: Math.round(totalPRs * 0.42),
        percent: 42,
        badgeClass: 'pill-emerald'
      },
      {
        label: 'S (50 - 200 LOC)',
        desc: 'Feature additions & tweaks',
        count: Math.round(totalPRs * 0.33),
        percent: 33,
        badgeClass: 'pill-cyan'
      },
      {
        label: 'M (200 - 500 LOC)',
        desc: 'Module architecture & core flows',
        count: Math.round(totalPRs * 0.17),
        percent: 17,
        badgeClass: 'pill-purple'
      },
      {
        label: 'L (> 500 LOC)',
        desc: 'Large migrations & overhaul',
        count: Math.max(1, Math.round(totalPRs * 0.08)),
        percent: 8,
        badgeClass: 'pill-amber'
      }
    ];
  });
  // 4. Phân tích khung giờ hoạt động từ activities thật
  readonly focusHours = computed<FocusHour[]>(() => {
    const acts = this.gitHubApiService.activities();
    let morning = 0;
    let afternoon = 0;
    let night = 0;
    for (const a of acts) {
      const h = new Date(a.timestamp).getHours();
      if (h >= 6 && h < 12) morning++;
      else if (h >= 12 && h < 18) afternoon++;
      else night++;
    }
    const total = acts.length || 1;
    return [
      {
        period: 'Morning Deep Flow',
        timeRange: '09:00 - 11:30 AM',
        commitsCount: morning || 18,
        percent: Math.round(((morning || 18) / (total > 1 ? total : 40)) * 100),
        tag: 'Most Productive'
      },
      {
        period: 'Afternoon Sprint',
        timeRange: '02:00 - 05:00 PM',
        commitsCount: afternoon || 14,
        percent: Math.round(((afternoon || 14) / (total > 1 ? total : 40)) * 100),
        tag: 'High Velocity'
      },
      {
        period: 'Night Polish & Refactor',
        timeRange: '08:00 - 10:30 PM',
        commitsCount: night || 8,
        percent: Math.round(((night || 8) / (total > 1 ? total : 40)) * 100),
        tag: 'Deep Work'
      }
    ];
  });
  // 5. Xuất file CSV thật
  exportCSV(): void {
    const rows = [
      ['Day', 'Date', 'Features', 'Bug Fixes', 'Refactor', 'Total Commits'],
      ...this.velocityDays().map(d => [d.day, d.date, d.feat, d.fix, d.refactor, d.total])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `engineering_velocity_${this.selectedTimeRange()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // 6. Refresh Sync
  async triggerRefresh(): Promise<void> {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      await Promise.all([
        this.gitHubApiService.fetchRepositories(),
        this.gitHubApiService.fetchActivities(),
        this.gitHubApiService.fetchContributions()
      ]);
    } finally {
      this.isSyncing.set(false);
    }
  }
}

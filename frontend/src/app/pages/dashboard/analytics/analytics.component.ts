import { Component, signal, computed } from '@angular/core';
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

  // 2. Signals quản lý trạng thái
  selectedTimeRange = signal<'7d' | '30d' | '90d' | '1y'>('30d');
  isSyncing = signal<boolean>(false);
  hoveredDay = signal<VelocityDay | null>(null);
  // 3. Dữ liệu biểu đồ Commit Velocity theo 7 ngày gần nhất
  velocityDays: VelocityDay[] = [
    { day: 'Mon', date: 'Feb 26', feat: 8, fix: 3, refactor: 2, total: 13 },
    { day: 'Tue', date: 'Feb 27', feat: 12, fix: 5, refactor: 4, total: 21 },
    { day: 'Wed', date: 'Feb 28', feat: 6, fix: 8, refactor: 1, total: 15 },
    { day: 'Thu', date: 'Feb 29', feat: 14, fix: 2, refactor: 5, total: 21 },
    { day: 'Fri', date: 'Mar 01', feat: 18, fix: 6, refactor: 4, total: 28 },
    { day: 'Sat', date: 'Mar 02', feat: 5, fix: 1, refactor: 2, total: 8 },
    { day: 'Sun', date: 'Mar 03', feat: 3, fix: 0, refactor: 1, total: 4 }
  ];
  // Chiều cao tối đa của biểu đồ cột (tính theo pixel)
  readonly maxChartHeight = 160;
  readonly maxDayTotal = Math.max(...this.velocityDays.map(d => d.total));
  // 4. Dữ liệu phân bổ ngôn ngữ lập trình
  languages: LanguageStat[] = [
    { name: 'TypeScript', percent: 46, lines: '64.2k LOC', color: '#38bdf8' },
    { name: 'Go / Golang', percent: 28, lines: '39.1k LOC', color: '#00add8' },
    { name: 'PostgreSQL / SQL', percent: 14, lines: '19.5k LOC', color: '#a78bfa' },
    { name: 'HTML & CSS', percent: 12, lines: '16.8k LOC', color: '#f43f5e' }
  ];
  // 5. Phân loại kích thước Pull Requests
  prSizes: PRSizeDistribution[] = [
    { label: 'Small (<100 LOC)', desc: 'Fast track review (<2h)', count: 42, percent: 62, badgeClass: 'pill-emerald' },
    { label: 'Medium (100-400 LOC)', desc: 'Standard architectural review', count: 19, percent: 28, badgeClass: 'pill-cyan' },
    { label: 'Large (>400 LOC)', desc: 'Complex cross-module RFC', count: 7, percent: 10, badgeClass: 'pill-amber' }
  ];
  // 6. Nhịp sinh học lập trình (Peak Focus Hours)
  focusHours: FocusHour[] = [
    { period: 'Morning Deep Flow', timeRange: '09:00 - 11:30 AM', commitsCount: 62, percent: 42, tag: 'Most Productive' },
    { period: 'Afternoon Sprint', timeRange: '02:00 - 05:00 PM', commitsCount: 56, percent: 38, tag: 'High Velocity' },
    { period: 'Night Polish & Refactor', timeRange: '08:00 - 10:30 PM', commitsCount: 30, percent: 20, tag: 'Deep Work' }
  ];
  // Thao tác đổi khoảng thời gian
  setTimeRange(range: '7d' | '30d' | '90d' | '1y') {
    this.selectedTimeRange.set(range);
  }
  // Thao tác reload/sync dữ liệu
  triggerRefresh() {
    this.isSyncing.set(true);
    setTimeout(() => {
      this.isSyncing.set(false);
    }, 900);
  }
  // Tính chiều cao pixel của từng phân khúc cột
  calculateHeight(val: number): number {
    return Math.round((val / this.maxDayTotal) * this.maxChartHeight);
  }
}

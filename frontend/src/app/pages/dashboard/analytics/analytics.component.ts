import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
export class AnalyticsComponent implements OnInit {
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
  private readonly platformId = inject(PLATFORM_ID);

  // Signals quản lý trạng thái: Mặc định hiển thị 7 ngày để khớp với biểu đồ tuần
  selectedTimeRange = signal<'7d' | '30d' | '90d' | '1y'>('7d');
  isSyncing = signal<boolean>(false);
  hoveredDay = signal<VelocityDay | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.ensureDataLoaded(), 150);
    }
  }

  ngOnInit(): void {
    this.ensureDataLoaded();
  }

  private async ensureDataLoaded(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.gitHubApiService.isAuthenticated()) {
      const promises: Promise<any>[] = [];
      if (!this.gitHubApiService.contributions()) {
        promises.push(this.gitHubApiService.fetchContributions());
      }
      if (this.gitHubApiService.repositories().length === 0) {
        promises.push(this.gitHubApiService.fetchRepositories());
      }
      if (this.gitHubApiService.activities().length === 0) {
        promises.push(this.gitHubApiService.fetchActivities());
      }
      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }

      // Nếu activities vẫn trống và có repos, lấy commits từ repo đầu tiên
      const repos = this.gitHubApiService.repositories();
      if (this.gitHubApiService.activities().length === 0 && repos.length > 0) {
        const topRepo = repos[0];
        const commits = await this.gitHubApiService.fetchRepoCommits(topRepo.fullName || topRepo.name);
        if (commits && commits.length > 0 && this.gitHubApiService.activities().length === 0) {
          this.gitHubApiService.activities.set(commits);
        }
      }
    }
  }

  setTimeRange(range: '7d' | '30d' | '90d' | '1y'): void {
    this.selectedTimeRange.set(range);
  }

  // 1. Lọc chỉ lấy các ngày từ quá khứ đến hôm nay (bỏ qua ngày tương lai trong năm của GraphQL)
  private getValidCalendarDays(): any[] {
    const contrib = this.gitHubApiService.contributions();
    const weeks = contrib?.contributionCalendar?.weeks || contrib?.weeks;
    if (!weeks?.length) return [];
    const allDays = weeks.flatMap((w: any) => w.contributionDays || []);
    const todayStr = new Date().toISOString().split('T')[0];
    return allDays.filter((d: any) => d && d.date && d.date <= todayStr);
  }

  // Tiêu đề & mô tả biểu đồ thích ứng động theo mốc thời gian
  readonly chartTitle = computed(() => {
    switch (this.selectedTimeRange()) {
      case '7d': return 'Weekly Commit Velocity & Breakdown';
      case '30d': return '30-Day Commit Velocity (Weekly Breakdown)';
      case '90d': return 'Quarterly Commit Velocity (Monthly Breakdown)';
      case '1y': return 'Annual Commit Velocity (12 Months)';
    }
  });

  readonly chartDesc = computed(() => {
    switch (this.selectedTimeRange()) {
      case '7d': return 'Daily commit throughput over the last 7 days';
      case '30d': return 'Weekly commit throughput over the last 4 weeks';
      case '90d': return 'Monthly commit throughput over the last 3 months';
      case '1y': return 'Monthly commit throughput across the 12 months';
    }
  });

  // 2. Trích xuất các cột biểu đồ phản hồi theo mốc thời gian đang chọn
  readonly velocityDays = computed<VelocityDay[]>(() => {
    const range = this.selectedTimeRange();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Bảng tra cứu commit từ activities
    const acts = this.gitHubApiService.activities();
    const actCommitsByDate: Record<string, { feat: number; fix: number; refactor: number; total: number }> = {};
    for (const a of acts) {
      if (a.type === 'commit' && a.timestamp) {
        const dStr = new Date(a.timestamp).toISOString().split('T')[0];
        if (dStr <= todayStr) {
          if (!actCommitsByDate[dStr]) {
            actCommitsByDate[dStr] = { feat: 0, fix: 0, refactor: 0, total: 0 };
          }
          actCommitsByDate[dStr].total++;
          const title = (a.title || '').toLowerCase();
          if (title.includes('feat') || title.includes('add') || title.includes('create') || title.includes('new')) {
            actCommitsByDate[dStr].feat++;
          } else if (title.includes('fix') || title.includes('bug') || title.includes('patch') || title.includes('resolve')) {
            actCommitsByDate[dStr].fix++;
          } else {
            actCommitsByDate[dStr].refactor++;
          }
        }
      }
    }

    // Bảng tra cứu từ GraphQL calendar
    const validDays = this.getValidCalendarDays();
    const calMap: Record<string, number> = {};
    for (const d of validDays) {
      if (d.date) calMap[d.date] = d.contributionCount || 0;
    }

    // Hàm lấy chi tiết của 1 ngày cụ thể
    const getDayMetrics = (dateIso: string) => {
      const calCount = calMap[dateIso] || 0;
      const act = actCommitsByDate[dateIso];
      const actCount = act?.total || 0;
      const total = Math.max(calCount, actCount);
      if (total === 0) return { feat: 0, fix: 0, refactor: 0, total: 0 };
      if (act && act.total >= total) {
        return { feat: act.feat, fix: act.fix, refactor: act.refactor, total };
      }
      const feat = Math.ceil(total * 0.5);
      const fix = Math.floor(total * 0.3);
      const refactor = Math.max(0, total - feat - fix);
      return { feat, fix, refactor, total };
    };

    // A. 7 NGÀY GẦN NHẤT (Daily: 6 ngày trước đến hôm nay)
    if (range === '7d') {
      const result: VelocityDay[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        const iso = `${y}-${m}-${dayNum}`;
        const metrics = getDayMetrics(iso);
        result.push({
          day: dayNames[d.getDay()],
          date: `${monthNames[d.getMonth()]} ${dayNum}`,
          ...metrics
        });
      }
      return result;
    }

    // B. 30 NGÀY GẦN NHẤT (4 tuần kết thúc vào hôm nay)
    if (range === '30d') {
      const result: VelocityDay[] = [];
      for (let i = 3; i >= 0; i--) {
        const endD = new Date(today);
        endD.setDate(today.getDate() - i * 7);
        const startD = new Date(today);
        startD.setDate(today.getDate() - (i + 1) * 7 + 1);

        let feat = 0;
        let fix = 0;
        let refactor = 0;
        let total = 0;

        const cur = new Date(startD);
        while (cur <= endD) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const dayNum = String(cur.getDate()).padStart(2, '0');
          const mData = getDayMetrics(`${y}-${m}-${dayNum}`);
          feat += mData.feat;
          fix += mData.fix;
          refactor += mData.refactor;
          total += mData.total;
          cur.setDate(cur.getDate() + 1);
        }

        const startLabel = `${monthNames[startD.getMonth()]} ${String(startD.getDate()).padStart(2, '0')}`;
        const endLabel = `${monthNames[endD.getMonth()]} ${String(endD.getDate()).padStart(2, '0')}`;

        result.push({
          day: `Week ${4 - i}`,
          date: `${startLabel} - ${endLabel}`,
          feat,
          fix,
          refactor,
          total
        });
      }
      return result;
    }

    // C. 90 NGÀY GẦN NHẤT (3 tháng gần nhất)
    if (range === '90d') {
      const result: VelocityDay[] = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthIndex = d.getMonth();
        const yearNum = d.getFullYear();
        const monthPrefix = `${yearNum}-${String(monthIndex + 1).padStart(2, '0')}`;

        let feat = 0;
        let fix = 0;
        let refactor = 0;
        let total = 0;

        for (const [dateIso] of Object.entries(calMap)) {
          if (dateIso.startsWith(monthPrefix) && dateIso <= todayStr) {
            const m = getDayMetrics(dateIso);
            feat += m.feat;
            fix += m.fix;
            refactor += m.refactor;
            total += m.total;
          }
        }
        for (const [dateIso] of Object.entries(actCommitsByDate)) {
          if (dateIso.startsWith(monthPrefix) && dateIso <= todayStr && !calMap[dateIso]) {
            const m = getDayMetrics(dateIso);
            feat += m.feat;
            fix += m.fix;
            refactor += m.refactor;
            total += m.total;
          }
        }

        result.push({
          day: monthNames[monthIndex],
          date: `${yearNum}`,
          feat,
          fix,
          refactor,
          total
        });
      }
      return result;
    }

    // D. NĂM NAY (12 tháng: Jan -> Dec)
    const result: VelocityDay[] = [];
    const currentYear = today.getFullYear();
    for (let m = 0; m < 12; m++) {
      const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
      let feat = 0;
      let fix = 0;
      let refactor = 0;
      let total = 0;

      for (const [dateIso] of Object.entries(calMap)) {
        if (dateIso.startsWith(monthPrefix) && dateIso <= todayStr) {
          const mData = getDayMetrics(dateIso);
          feat += mData.feat;
          fix += mData.fix;
          refactor += mData.refactor;
          total += mData.total;
        }
      }
      for (const [dateIso] of Object.entries(actCommitsByDate)) {
        if (dateIso.startsWith(monthPrefix) && dateIso <= todayStr && !calMap[dateIso]) {
          const mData = getDayMetrics(dateIso);
          feat += mData.feat;
          fix += mData.fix;
          refactor += mData.refactor;
          total += mData.total;
        }
      }

      result.push({
        day: monthNames[m],
        date: `${currentYear}`,
        feat,
        fix,
        refactor,
        total
      });
    }
    return result;
  });

  // 3. Commit Throughput đồng bộ chính xác với tổng số commit của khoảng thời gian đang hiển thị
  readonly commitThroughput = computed(() => {
    const vDays = this.velocityDays();
    const sumFromChart = vDays.reduce((sum, d) => sum + d.total, 0);
    if (sumFromChart > 0) return sumFromChart;

    const contrib = this.gitHubApiService.contributions();
    const totalYear = contrib?.totalAnnualContributions ?? contrib?.contributionCalendar?.totalContributions ?? contrib?.totalContributions ?? 0;
    if (this.selectedTimeRange() === '1y') return totalYear;

    return 0;
  });

  readonly totalPRs = computed(() => {
    const prActs = this.gitHubApiService.activities().filter(a => a.type === 'pr');
    if (prActs.length > 0) return prActs.length;
    const contrib = this.gitHubApiService.contributions();
    return contrib?.totalPullRequestContributions || 0;
  });
  readonly totalReposCount = computed(() => this.gitHubApiService.repositories().length);
  readonly totalActivitiesCount = computed(() => this.gitHubApiService.activities().length);

  readonly refactorRatio = computed(() => {
    const acts = this.gitHubApiService.activities();
    if (acts.length === 0) return '0%';
    const refactorActs = acts.filter(a =>
      a.title?.toLowerCase().includes('refactor') ||
      a.title?.toLowerCase().includes('clean') ||
      a.title?.toLowerCase().includes('fix') ||
      a.title?.toLowerCase().includes('perf')
    );
    const pct = Math.round((refactorActs.length / acts.length) * 100);
    return `${pct}%`;
  });

  // Chiều cao tối đa biểu đồ
  readonly maxChartHeight = 150;
  readonly maxDayTotal = computed(() => {
    const max = Math.max(...this.velocityDays().map(d => d.total));
    return max > 0 ? max : 5;
  });

  calculateHeight(val: number): number {
    if (val <= 0) return 0;
    return Math.max(6, Math.round((val / this.maxDayTotal()) * this.maxChartHeight));
  }

  // 4. Phân bổ ngôn ngữ thực tế từ các Repositories thật
  readonly languages = computed<LanguageStat[]>(() => {
    const repos = this.gitHubApiService.repositories();
    if (!repos.length) return [];
    const counts: Record<string, number> = {};
    let total = 0;

    for (const r of repos) {
      const rawLang = r.language?.trim();
      const lang = rawLang && rawLang !== '' ? rawLang : 'Other';
      counts[lang] = (counts[lang] || 0) + 1;
      total++;
    }

    if (total === 0) return [];

    const colors: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      HTML: '#e34c26',
      CSS: '#563d7c',
      SCSS: '#c6538c',
      Python: '#3572A5',
      'C#': '#178600',
      'C++': '#f34b7d',
      C: '#555555',
      Java: '#b07219',
      PHP: '#4F5D95',
      Go: '#00ADD8',
      Rust: '#dea584',
      Dart: '#00B4AB',
      Swift: '#F05138',
      Kotlin: '#A97BFF',
      Vue: '#41b883',
      Shell: '#89e051',
      Markdown: '#083fa1',
      'Jupyter Notebook': '#DA5B0B',
      Other: '#64748b'
    };

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top4 = sorted.slice(0, 4);
    const otherCount = sorted.slice(4).reduce((sum, [, c]) => sum + c, 0);

    const result: LanguageStat[] = top4.map(([name, count]) => ({
      name,
      percent: Math.max(1, Math.round((count / total) * 100)),
      lines: `${count} ${count === 1 ? 'repo' : 'repos'}`,
      color: colors[name] || this.gitHubApiService.getLanguageColor(name) || '#8b949e'
    }));

    if (otherCount > 0) {
      result.push({
        name: 'Other',
        percent: Math.max(1, Math.round((otherCount / total) * 100)),
        lines: `${otherCount} repos`,
        color: '#64748b'
      });
    }

    // Đảm bảo tổng percent = 100% để thanh phân tầng lấp đầy chuẩn xác
    const currentSum = result.reduce((acc, item) => acc + item.percent, 0);
    if (currentSum > 0 && result.length > 0) {
      result[0].percent += (100 - currentSum);
    }

    return result;
  });

  // PR Size distribution
  readonly prSizes = computed<PRSizeDistribution[]>(() => {
    const totalPRs = this.totalPRs();

    if (totalPRs === 0) {
      return [
        {
          label: 'XS (< 50 LOC)',
          desc: 'Quick fix & typo patches',
          count: 0,
          percent: 0,
          badgeClass: 'pill-emerald'
        },
        {
          label: 'S (50 - 200 LOC)',
          desc: 'Feature additions & tweaks',
          count: 0,
          percent: 0,
          badgeClass: 'pill-cyan'
        },
        {
          label: 'M (200 - 500 LOC)',
          desc: 'Module architecture & core flows',
          count: 0,
          percent: 0,
          badgeClass: 'pill-purple'
        },
        {
          label: 'L (> 500 LOC)',
          desc: 'Large migrations & overhaul',
          count: 0,
          percent: 0,
          badgeClass: 'pill-amber'
        }
      ];
    }

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

  // 5. Phân tích khung giờ hoạt động từ activities thật
  readonly focusHours = computed<FocusHour[]>(() => {
    const acts = this.gitHubApiService.activities();
    let morning = 0;
    let afternoon = 0;
    let night = 0;

    for (const a of acts) {
      if (!a.timestamp) continue;
      const h = new Date(a.timestamp).getHours();
      if (h >= 6 && h < 12) morning++;
      else if (h >= 12 && h < 18) afternoon++;
      else night++;
    }

    const total = morning + afternoon + night;
    if (total === 0) {
      return [
        {
          period: 'Morning Deep Flow',
          timeRange: '09:00 - 11:30 AM',
          commitsCount: 0,
          percent: 0,
          tag: 'Awaiting activity'
        },
        {
          period: 'Afternoon Sprint',
          timeRange: '02:00 - 05:00 PM',
          commitsCount: 0,
          percent: 0,
          tag: 'Awaiting activity'
        },
        {
          period: 'Night Polish & Refactor',
          timeRange: '08:00 - 10:30 PM',
          commitsCount: 0,
          percent: 0,
          tag: 'Awaiting activity'
        }
      ];
    }

    return [
      {
        period: 'Morning Deep Flow',
        timeRange: '09:00 - 11:30 AM',
        commitsCount: morning,
        percent: Math.round((morning / total) * 100),
        tag: morning >= afternoon && morning >= night ? 'Most Productive' : 'Deep Flow'
      },
      {
        period: 'Afternoon Sprint',
        timeRange: '02:00 - 05:00 PM',
        commitsCount: afternoon,
        percent: Math.round((afternoon / total) * 100),
        tag: afternoon >= morning && afternoon >= night ? 'Peak Velocity' : 'Active Sprint'
      },
      {
        period: 'Night Polish & Refactor',
        timeRange: '08:00 - 10:30 PM',
        commitsCount: night,
        percent: Math.round((night / total) * 100),
        tag: night >= morning && night >= afternoon ? 'Night Shift Focus' : 'Polish & Docs'
      }
    ];
  });

  // 6. Xuất file CSV thật
  exportCSV(): void {
    const rows = [
      ['Period', 'Date/Range', 'Features', 'Bug Fixes', 'Refactor', 'Total Commits'],
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

  // 7. Refresh Sync
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

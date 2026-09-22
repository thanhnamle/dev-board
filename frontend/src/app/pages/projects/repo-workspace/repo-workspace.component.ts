import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  GitBranch,
  GitCommit,
  GitPullRequest,
  FolderGit2,
  ExternalLink,
  Copy,
  Check,
  Search,
  ChevronDown,
  Clock,
  Sparkles,
  ShieldCheck,
  Terminal,
  Code2,
  Star,
  GitFork,
  ArrowUpRight,
  Info,
  Layers,
  Tag,
  CheckCircle2,
  XCircle,
  Clock3,
  User,
  RefreshCw
} from 'lucide-angular';
import { GitHubApiService, GitHubRepoItem, GitCommitDetail, GitPullRequestItem, GitBranchItem } from '../../../core/services/github-api.service';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';

export interface GraphNode {
  commit: GitCommitDetail;
  lane: number;
  x: number;
  y: number;
  color: string;
  isMerge: boolean;
}

export interface GraphLink {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  path: string;
}

@Component({
  selector: 'app-repo-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './repo-workspace.component.html',
  styleUrl: './repo-workspace.component.css'
})
export class RepoWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly gitHubApi = inject(GitHubApiService);
  readonly workspace = inject(WorkspaceDataService);

  // Lucide Icons
  readonly GitBranch = GitBranch;
  readonly GitCommit = GitCommit;
  readonly GitPullRequest = GitPullRequest;
  readonly FolderGit2 = FolderGit2;
  readonly ExternalLink = ExternalLink;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly Clock = Clock;
  readonly Sparkles = Sparkles;
  readonly ShieldCheck = ShieldCheck;
  readonly Terminal = Terminal;
  readonly Code2 = Code2;
  readonly Star = Star;
  readonly GitFork = GitFork;
  readonly ArrowUpRight = ArrowUpRight;
  readonly Info = Info;
  readonly Layers = Layers;
  readonly Tag = Tag;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Clock3 = Clock3;
  readonly User = User;
  readonly RefreshCw = RefreshCw;

  // Workspace Navigation & State
  activeTab = signal<'graph' | 'commits' | 'pulls' | 'branches' | 'overview'>('graph');
  selectedRepoName = signal<string>('');
  loading = signal<boolean>(false);
  commitSearch = signal<string>('');
  prFilter = signal<'all' | 'open' | 'closed' | 'merged'>('all');
  copiedSha = signal<string | null>(null);
  copiedClone = signal<boolean>(false);
  selectedCommit = signal<GitCommitDetail | null>(null);
  isRepoDropdownOpen = signal<boolean>(false);

  // Raw Data Signals
  commits = signal<GitCommitDetail[]>([]);
  totalCommitsCount = signal<number>(0);
  hasMoreCommits = signal<boolean>(false);
  commitsPage = signal<number>(1);
  loadingMoreCommits = signal<boolean>(false);
  pullRequests = signal<GitPullRequestItem[]>([]);
  branches = signal<GitBranchItem[]>([]);

  // Repositories List
  allRepos = computed<GitHubRepoItem[]>(() => {
    const repos = this.gitHubApi.repositories();
    if (repos.length > 0) return repos;
    return this.workspace.projects().map(p => ({
      id: p.id,
      name: p.name,
      fullName: p.repoName,
      description: p.description,
      language: p.language,
      languageColor: p.languageColor,
      starsCount: p.starsCount,
      forksCount: p.forksCount ?? 0,
      openIssuesCount: 0,
      isFork: false,
      isPrivate: p.isPrivate ?? false,
      license: 'MIT',
      tags: p.tags,
      htmlUrl: p.githubUrl,
      cloneUrl: `${p.githubUrl}.git`,
      updatedAt: p.updatedAt || new Date().toISOString(),
      updatedRelative: p.lastCommitTime || 'Recently',
      defaultBranch: p.branch || 'main'
    }));
  });

  // Current Selected Repository
  currentRepo = computed<GitHubRepoItem | null>(() => {
    const name = this.selectedRepoName().toLowerCase().trim();
    if (!name) return this.allRepos()[0] || null;
    return (
      this.allRepos().find(
        r => r.fullName.toLowerCase() === name || r.name.toLowerCase() === name
      ) || this.allRepos()[0] || null
    );
  });

  // Filtered Commits
  filteredCommits = computed(() => {
    const q = this.commitSearch().toLowerCase().trim();
    if (!q) return this.commits();
    return this.commits().filter(
      c =>
        c.message.toLowerCase().includes(q) ||
        c.shortSha.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q)
    );
  });

  // Filtered PRs
  filteredPRs = computed(() => {
    const f = this.prFilter();
    const list = this.pullRequests();
    if (f === 'all') return list;
    return list.filter(pr => pr.state === f);
  });

  // Open PR count
  openPRsCount = computed(() => this.pullRequests().filter(pr => pr.state === 'open').length);

  // LANE COLOR PALETTE - 8 high-contrast modern neon colors
  private readonly laneColors = [
    '#6366f1', // Indigo (Lane 0 / Main)
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#8b5cf6', // Purple
    '#f97316', // Orange
    '#14b8a6', // Teal
  ];

  // COMPUTED GIT GRAPH NODES & LINKS
  graphData = computed<{ nodes: GraphNode[]; links: GraphLink[]; height: number; width: number }>(() => {
    const list = this.commits();
    if (list.length === 0) return { nodes: [], links: [], height: 200, width: 140 };

    const shaIndexMap = new Map<string, number>();
    list.forEach((c, i) => shaIndexMap.set(c.sha, i));

    // Optimized branch lane assignment with greedy left-packing and full merge cleanup
    const lanes: number[] = new Array(list.length).fill(0);
    const activeBranches: (string | null)[] = [];

    list.forEach((c, i) => {
      // Find all lanes expecting this commit
      const matchingLanes: number[] = [];
      activeBranches.forEach((b, idx) => {
        if (b === c.sha) matchingLanes.push(idx);
      });

      let lane: number;
      if (matchingLanes.length > 0) {
        lane = matchingLanes[0];
        // All other lanes that were waiting for this commit are now merged -> free them immediately!
        for (let m = 1; m < matchingLanes.length; m++) {
          activeBranches[matchingLanes[m]] = null;
        }
      } else {
        lane = activeBranches.indexOf(null);
        if (lane === -1) {
          lane = activeBranches.length;
          activeBranches.push(null);
        }
      }

      lanes[i] = lane;

      if (c.parents.length > 0) {
        // First parent continues on this lane
        activeBranches[lane] = c.parents[0];

        // Merge parents (branches being merged in)
        for (let p = 1; p < c.parents.length; p++) {
          const parentSha = c.parents[p];
          if (!activeBranches.includes(parentSha)) {
            const emptyLane = activeBranches.indexOf(null);
            if (emptyLane !== -1) {
              activeBranches[emptyLane] = parentSha;
            } else {
              activeBranches.push(parentSha);
            }
          }
        }
      } else {
        activeBranches[lane] = null;
      }
    });

    const ROW_HEIGHT = 40;
    const LANE_WIDTH = 16;
    const OFFSET_X = 18;
    const OFFSET_Y = 20;

    const maxLane = lanes.reduce((max, l) => Math.max(max, l), 0);
    // Dynamic compact width with clean buffer
    const graphWidth = Math.max(64, OFFSET_X + (maxLane + 1) * LANE_WIDTH + 14);

    const nodes: GraphNode[] = list.map((c, i) => {
      const lane = lanes[i];
      const colorIndex = lane % this.laneColors.length;
      return {
        commit: c,
        lane,
        x: OFFSET_X + lane * LANE_WIDTH,
        y: OFFSET_Y + i * ROW_HEIGHT,
        color: this.laneColors[colorIndex],
        isMerge: c.parents.length > 1
      };
    });

    const links: GraphLink[] = [];
    nodes.forEach((node, i) => {
      node.commit.parents.forEach((parentSha, pIdx) => {
        const parentIdx = shaIndexMap.get(parentSha);
        if (parentIdx !== undefined && parentIdx > i) {
          const targetNode = nodes[parentIdx];
          const dy = targetNode.y - node.y;
          let path = '';

          if (node.x === targetNode.x) {
            // Straight vertical line down in the same lane
            path = `M ${node.x} ${node.y} L ${targetNode.x} ${targetNode.y}`;
          } else if (dy <= ROW_HEIGHT * 2) {
            // Smooth continuous S-curve over 1-2 rows
            const midY = node.y + dy * 0.5;
            path = `M ${node.x} ${node.y} C ${node.x} ${midY}, ${targetNode.x} ${midY}, ${targetNode.x} ${targetNode.y}`;
          } else {
            // Graceful railway-switch curve over the first row height, then straight down
            const bendY = node.y + ROW_HEIGHT;
            path = `M ${node.x} ${node.y} C ${node.x} ${node.y + ROW_HEIGHT * 0.5}, ${targetNode.x} ${node.y + ROW_HEIGHT * 0.5}, ${targetNode.x} ${bendY} L ${targetNode.x} ${targetNode.y}`;
          }

          links.push({
            fromX: node.x,
            fromY: node.y,
            toX: targetNode.x,
            toY: targetNode.y,
            color: pIdx === 0 ? node.color : targetNode.color,
            path
          });
        }
      });
    });

    const totalHeight = OFFSET_Y * 2 + list.length * ROW_HEIGHT;
    return { nodes, links, height: Math.max(300, totalHeight), width: graphWidth };
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const repoParam = params.get('repo');
      if (repoParam && repoParam !== this.selectedRepoName()) {
        this.selectedRepoName.set(repoParam);
        this.loadWorkspaceData(repoParam);
      }
    });
  }

  ngOnInit() {
    if (!this.selectedRepoName()) {
      const first = this.allRepos()[0];
      if (first) {
        this.selectRepository(first.fullName);
      }
    }
  }

  selectRepository(repoFullName: string) {
    this.selectedRepoName.set(repoFullName);
    this.isRepoDropdownOpen.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { repo: repoFullName },
      queryParamsHandling: 'merge'
    });
    this.loadWorkspaceData(repoFullName);
  }

  async loadWorkspaceData(repoName: string) {
    if (!repoName) return;
    this.loading.set(true);

    try {
      const [commitsResult, pullsData, branchesData] = await Promise.all([
        this.gitHubApi.fetchRepoFullCommits(repoName, 1, 100),
        this.gitHubApi.fetchRepoPulls(repoName),
        this.gitHubApi.fetchRepoBranches(repoName)
      ]);

      if (commitsResult.commits.length > 0) {
        this.commits.set(commitsResult.commits);
        this.totalCommitsCount.set(commitsResult.totalCount);
        this.hasMoreCommits.set(commitsResult.hasMore);
        this.commitsPage.set(commitsResult.page);
        this.selectedCommit.set(commitsResult.commits[0]);
      } else {
        // Fallback demo commits if empty
        this.generateFallbackCommits(repoName);
        this.totalCommitsCount.set(this.commits().length);
        this.hasMoreCommits.set(false);
      }

      if (pullsData.length > 0) {
        this.pullRequests.set(pullsData);
      } else {
        this.generateFallbackPulls(repoName);
      }

      if (branchesData.length > 0) {
        this.branches.set(branchesData);
      } else {
        this.branches.set([
          { name: 'main', commitSha: 'a1b2c3d4e5f6', shortSha: 'a1b2c3d', isDefault: true, protected: true },
          { name: 'develop', commitSha: 'b2c3d4e5f6a1', shortSha: 'b2c3d4e', isDefault: false, protected: false },
          { name: 'feature/auth-v2', commitSha: 'c3d4e5f6a1b2', shortSha: 'c3d4e5f', isDefault: false, protected: false }
        ]);
      }
    } catch (e) {
      console.error('Error loading repo workspace data:', e);
      this.generateFallbackCommits(repoName);
      this.generateFallbackPulls(repoName);
      this.totalCommitsCount.set(this.commits().length);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMoreCommits() {
    const repo = this.currentRepo()?.fullName;
    if (!repo || this.loadingMoreCommits() || !this.hasMoreCommits()) return;

    this.loadingMoreCommits.set(true);
    try {
      const nextPage = this.commitsPage() + 1;
      const res = await this.gitHubApi.fetchRepoFullCommits(repo, nextPage, 100);
      if (res.commits.length > 0) {
        this.commits.update(existing => [...existing, ...res.commits]);
        this.commitsPage.set(nextPage);
        this.hasMoreCommits.set(res.hasMore);
        this.totalCommitsCount.set(Math.max(this.totalCommitsCount(), res.totalCount, this.commits().length));
      } else {
        this.hasMoreCommits.set(false);
      }
    } catch (err) {
      console.error('Failed to load more commits:', err);
    } finally {
      this.loadingMoreCommits.set(false);
    }
  }

  private generateFallbackCommits(repoName: string) {
    const user = this.gitHubApi.currentUser()?.login || 'developer';
    const now = Date.now();
    const demoCommits: GitCommitDetail[] = [
      {
        id: 1,
        sha: '9f8b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
        shortSha: '9f8b1a2',
        message: 'feat(core): implement responsive obsidian workspace layout',
        description: 'Refactor split containers and improve dark/light theme tokens across all modules.',
        authorName: user,
        authorLogin: user,
        timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        timeAgo: '45m ago',
        parents: ['8e7a0f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f'],
        htmlUrl: `https://github.com/${repoName}`,
        verified: true
      },
      {
        id: 2,
        sha: '8e7a0f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f',
        shortSha: '8e7a0f1',
        message: 'merge: pull request #4 from devboard/feature-graph',
        description: 'Integrate SVG vector git graph with interactive commit nodes.',
        authorName: 'Alex',
        authorLogin: 'alex-dev',
        timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        timeAgo: '3h ago',
        parents: [
          '7d6c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c',
          '6c5b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b'
        ],
        htmlUrl: `https://github.com/${repoName}`,
        verified: true
      },
      {
        id: 3,
        sha: '7d6c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c',
        shortSha: '7d6c9b0',
        message: 'perf: optimize signal computation and reduce re-renders',
        authorName: user,
        authorLogin: user,
        timestamp: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
        timeAgo: '18h ago',
        parents: ['5b4a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a'],
        htmlUrl: `https://github.com/${repoName}`,
        verified: false
      },
      {
        id: 4,
        sha: '6c5b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b',
        shortSha: '6c5b8a9',
        message: 'feat(graph): add visual lane calculation algorithm',
        authorName: 'Alex',
        authorLogin: 'alex-dev',
        timestamp: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
        timeAgo: '22h ago',
        parents: ['5b4a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a'],
        htmlUrl: `https://github.com/${repoName}`,
        verified: true
      },
      {
        id: 5,
        sha: '5b4a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a',
        shortSha: '5b4a7f8',
        message: 'chore(deps): update angular core and lucide icons',
        authorName: 'bot-dependabot',
        authorLogin: 'dependabot',
        timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        timeAgo: '2d ago',
        parents: ['4a3f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f'],
        htmlUrl: `https://github.com/${repoName}`,
        verified: true
      }
    ];

    this.commits.set(demoCommits);
    this.selectedCommit.set(demoCommits[0]);
  }

  private generateFallbackPulls(repoName: string) {
    const user = this.gitHubApi.currentUser()?.login || 'developer';
    this.pullRequests.set([
      {
        id: 101,
        number: 14,
        title: 'feat: add git graph visual lanes and branch commits',
        state: 'open',
        merged: false,
        authorName: user,
        headRef: 'feature/git-graph',
        baseRef: 'main',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updatedAt: new Date().toISOString(),
        timeAgo: '2h ago',
        htmlUrl: `https://github.com/${repoName}/pull/14`,
        commentsCount: 3,
        body: 'Introduces an interactive SVG-based commit graph with node links and branch switching.',
        draft: false
      },
      {
        id: 102,
        number: 12,
        title: 'fix: resolve session expiration on server restart',
        state: 'merged',
        merged: true,
        authorName: 'Minh',
        headRef: 'fix/auth-session',
        baseRef: 'main',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        timeAgo: 'Yesterday',
        htmlUrl: `https://github.com/${repoName}/pull/12`,
        commentsCount: 5,
        body: 'Ensures cookie persistence and adds seamless re-authentication.',
        draft: false
      },
      {
        id: 103,
        number: 9,
        title: 'refactor: decouple workspace data service for local-first storage',
        state: 'merged',
        merged: true,
        authorName: user,
        headRef: 'refactor/workspace-service',
        baseRef: 'main',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        timeAgo: '4d ago',
        htmlUrl: `https://github.com/${repoName}/pull/9`,
        commentsCount: 2,
        body: 'Store notes and snippets directly in user-scoped localStorage with optimistic updates.',
        draft: false
      }
    ]);
  }

  copySha(sha: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(sha).then(() => {
      this.copiedSha.set(sha);
      setTimeout(() => {
        if (this.copiedSha() === sha) this.copiedSha.set(null);
      }, 1500);
    });
  }

  copyCloneCommand(url: string) {
    const cmd = `git clone ${url}`;
    navigator.clipboard.writeText(cmd).then(() => {
      this.copiedClone.set(true);
      setTimeout(() => this.copiedClone.set(false), 1500);
    });
  }

  selectCommitNode(commit: GitCommitDetail) {
    this.selectedCommit.set(commit);
  }

  toggleDropdown() {
    this.isRepoDropdownOpen.update(v => !v);
  }
}

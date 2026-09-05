export interface ProjectItem {
  id: number;
  name: string;
  repoName: string;
  description: string;
  language: string;
  languageColor: string;
  tags: string[];
  branch: string;
  lastCommit: string;
  lastCommitTime: string;
  deployStatus: 'production' | 'staging' | 'building';
  deployUrl?: string;
  githubUrl: string;
  starsCount: number;
  isStarred: boolean;
  isBookmarked: boolean;
}

export const DEMO_PROJECTS: ProjectItem[] = [
    {
      id: 1,
      name: 'DevBoard Frontend',
      repoName: 'payoo-devboard/frontend',
      description: 'Developer workspace hub and GitHub telemetry client built with Angular 17 and Signals.',
      language: 'TypeScript',
      languageColor: '#38bdf8',
      tags: ['Angular 17', 'Signals', 'Tailwind', 'SSR'],
      branch: 'main',
      lastCommit: 'feat(analytics): add commit velocity chart',
      lastCommitTime: '15m ago',
      deployStatus: 'production',
      deployUrl: 'https://devboard.payoo.vn',
      githubUrl: 'https://github.com',
      starsCount: 128,
      isStarred: true,
      isBookmarked: true
    },
    {
      id: 2,
      name: 'Core API Gateway',
      repoName: 'payoo-devboard/core-api',
      description: 'High-throughput microservices gateway and GitHub webhook processor in Golang.',
      language: 'Go',
      languageColor: '#00add8',
      tags: ['Go 1.22', 'Gin', 'gRPC', 'PostgreSQL'],
      branch: 'main',
      lastCommit: 'perf(webhook): optimize HMAC payload validation',
      lastCommitTime: '1h ago',
      deployStatus: 'production',
      deployUrl: 'https://api-devboard.payoo.vn',
      githubUrl: 'https://github.com',
      starsCount: 94,
      isStarred: true,
      isBookmarked: false
    },
    {
      id: 3,
      name: 'Authentication Service',
      repoName: 'payoo-devboard/auth-service',
      description: 'OAuth2 / OIDC token exchange and GitHub SSO refresh cycle management service.',
      language: 'TypeScript',
      languageColor: '#38bdf8',
      tags: ['NodeJS', 'OAuth2', 'JWT', 'Redis'],
      branch: 'feature/oauth-refresh',
      lastCommit: 'feat(auth): implement token rotation strategy',
      lastCommitTime: '3h ago',
      deployStatus: 'staging',
      deployUrl: 'https://staging-auth.payoo.vn',
      githubUrl: 'https://github.com',
      starsCount: 45,
      isStarred: false,
      isBookmarked: true
    },
    {
      id: 4,
      name: 'Payment SDK & Webhook',
      repoName: 'payoo-work/payment-sdk',
      description: 'Universal payment integration SDK supporting QR-Code, e-wallet, and instant IPN callbacks.',
      language: 'Go',
      languageColor: '#00add8',
      tags: ['Go', 'SDK', 'Fintech', 'HMAC-SHA256'],
      branch: 'main',
      lastCommit: 'refactor(sdk): simplify callback deserializer',
      lastCommitTime: '1d ago',
      deployStatus: 'production',
      githubUrl: 'https://github.com',
      starsCount: 210,
      isStarred: true,
      isBookmarked: true
    },
    {
      id: 5,
      name: 'Database Schema & Migrations',
      repoName: 'payoo-devboard/db-schema',
      description: 'PostgreSQL database DDL, schema migrations, and high-performance connection pool configs.',
      language: 'PostgreSQL',
      languageColor: '#a78bfa',
      tags: ['PostgreSQL', 'Prisma', 'Liquibase', 'SQL'],
      branch: 'main',
      lastCommit: 'chore(db): add index on github_events table',
      lastCommitTime: '2d ago',
      deployStatus: 'production',
      githubUrl: 'https://github.com',
      starsCount: 32,
      isStarred: false,
      isBookmarked: false
    },
    {
      id: 6,
      name: 'DevOps & Kubernetes Runbook',
      repoName: 'payoo-devboard/infra-k8s',
      description: 'Helm charts, Terraform IaC, Dockerfiles, and GitHub Actions CI/CD pipeline automation.',
      language: 'Docker',
      languageColor: '#2496ed',
      tags: ['Docker', 'Kubernetes', 'Helm', 'Terraform'],
      branch: 'staging',
      lastCommit: 'ci: update GitHub runner to ubuntu-latest',
      lastCommitTime: '4d ago',
      deployStatus: 'staging',
      githubUrl: 'https://github.com',
      starsCount: 67,
      isStarred: false,
      isBookmarked: false
    }
  ];

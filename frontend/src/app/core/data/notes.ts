export interface NoteItem {
  id: number;
  title: string;
  category: 'architecture' | 'infrastructure' | 'security' | 'runbooks';
  categoryLabel: string;
  excerpt: string;
  content: string[];
  readTime: string;
  wordCount: number;
  lastUpdated: string;
  pinned: boolean;
  tags: string[];
}

export const DEMO_NOTES: NoteItem[] = [
    {
      id: 1,
      title: 'DevBoard 2.0 SSR Pipeline & Hydration RFC',
      category: 'architecture',
      categoryLabel: 'Architecture',
      excerpt: 'Comprehensive architectural RFC on Angular 17 hydration mismatch fixes, state caching, and edge routing.',
      content: [
        '### 1. Architectural Overview',
        'This RFC specifies the SSR hydration pipeline for DevBoard 2.0. By moving from client-only rendering to non-destructive hydration with Angular 17, initial load time dropped from 1.8s to 240ms.',
        '### 2. Hydration Strategy & State Transfer',
        'State generated on the server is serialized using `TransferState` and hydrated into Angular Signals on client boot. This avoids redundant HTTP calls to GitHub telemetry API.',
        '### 3. Edge Caching Rules',
        '- Static landing page chunks: Cache-Control `s-maxage=86400, stale-while-revalidate`',
        '- Dynamic telemetry endpoints: Cache-Control `no-store, private`'
      ],
      readTime: '4 min read',
      wordCount: 1420,
      lastUpdated: 'Today at 09:15 AM',
      pinned: true,
      tags: ['Angular 17', 'SSR', 'Hydration', 'RFC']
    },
    {
      id: 2,
      title: 'PostgreSQL Connection Pooling & SSL Setup Guide',
      category: 'infrastructure',
      categoryLabel: 'Infrastructure',
      excerpt: 'High-concurrency database connection tuning with PgBouncer, SSL TLS 1.3 certificates, and failover replicas.',
      content: [
        '### 1. PgBouncer Configuration',
        'To support 10,000+ concurrent webhook callbacks without exhausting backend connection limits, PgBouncer is deployed in transaction pooling mode.',
        '### 2. TLS 1.3 Encryption',
        'All client connections require mutual TLS verification (`sslmode=verify-full`). SSL certificates are automatically renewed via cert-manager.',
        '### 3. Connection Health Check Query',
        'Run `SELECT * FROM pg_stat_activity WHERE state != \'idle\';` every 30s.'
      ],
      readTime: '6 min read',
      wordCount: 2150,
      lastUpdated: 'Yesterday at 04:30 PM',
      pinned: true,
      tags: ['PostgreSQL', 'PgBouncer', 'Security', 'Database']
    },
    {
      id: 3,
      title: 'GitHub SSO & Sliding Session Token Rotation',
      category: 'security',
      categoryLabel: 'Security',
      excerpt: 'OAuth 2.0 token exchange flow with sliding refresh windows and encrypted HTTP-only cookie persistence.',
      content: [
        '### 1. Threat Model & Token Lifecycle',
        'Access tokens expire after 15 minutes. Refresh tokens are single-use (rotated on each exchange) and stored in encrypted HTTP-only cookies with SameSite=Strict.',
        '### 2. Redis Session Blacklisting',
        'Revoked tokens are placed into a Redis bloom filter with a TTL matching the token lifetime.'
      ],
      readTime: '5 min read',
      wordCount: 1840,
      lastUpdated: '2 days ago',
      pinned: true,
      tags: ['OAuth2', 'JWT', 'Security', 'Auth']
    },
    {
      id: 4,
      title: 'Kubernetes Production Cluster Disaster Recovery Runbook',
      category: 'runbooks',
      categoryLabel: 'Runbook',
      excerpt: 'Step-by-step failover execution runbook for multi-region Kubernetes clusters during cloud provider outages.',
      content: [
        '### 1. Incident Escalation Protocol',
        'If primary region health check fails for > 60 seconds, trigger Cloudflare DNS failover script.',
        '### 2. Helm Rollout Verification',
        'Verify backup cluster status: `kubectl get pods -n production -l app=devboard-gateway`.'
      ],
      readTime: '8 min read',
      wordCount: 2890,
      lastUpdated: '3 days ago',
      pinned: false,
      tags: ['K8s', 'DevOps', 'Runbook', 'Cloud']
    },
    {
      id: 5,
      title: 'Linear Obsidian Theme Design Tokens & CSS Architecture',
      category: 'architecture',
      categoryLabel: 'Architecture',
      excerpt: 'Design token specification for dual Dark/Light mode theme harmony using CSS Custom Properties.',
      content: [
        '### 1. Token Hierarchy',
        'All component styling inherits from `:root, body.light-theme` and `body.dark-theme` custom properties to prevent CSS duplication.',
        '### 2. High-Contrast Badges',
        'Light mode utilizes saturated dark foregrounds on light pastel backgrounds (`#047857` on `#ecfdf5`), while Dark mode utilizes neon pastel glows.'
      ],
      readTime: '3 min read',
      wordCount: 980,
      lastUpdated: '4 days ago',
      pinned: false,
      tags: ['UI/UX', 'CSS Variables', 'Design System']
    }
  ];

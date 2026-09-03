import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Heart,
  Code2,
  Search,
  Copy,
  Check,
  FileCode,
  Tag,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-angular';

export interface FavoriteSnippet {
  id: number;
  title: string;
  filename: string;
  language: 'typescript' | 'go' | 'sql' | 'docker';
  languageLabel: string;
  description: string;
  rawCode: string;
  codeHtml: string;
  tags: string[];
  lastUsed: string;
  isFavorite: boolean;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent {
  // 1. Khai báo Lucide Icons
  readonly Heart = Heart;
  readonly Code2 = Code2;
  readonly Search = Search;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly FileCode = FileCode;
  readonly Tag = Tag;
  readonly Sparkles = Sparkles;
  readonly ExternalLink = ExternalLink;
  readonly Plus = Plus;

  // 2. Signals quản lý trạng thái
  searchQuery = signal<string>('');
  copiedSnippetId = signal<number | null>(null);

  // 3. Danh sách 12 Snippets yêu thích nhất
  favoritesList = signal<FavoriteSnippet[]>([
    {
      id: 1,
      title: 'Angular 17 Custom Debounced Signal Effect',
      filename: 'debounce-effect.util.ts',
      language: 'typescript',
      languageLabel: 'TypeScript',
      description: 'Debounce reactive effect execution on signal changes to prevent API throttling.',
      rawCode: `export function debouncedEffect<T>(source: Signal<T>, callback: (val: T) => void, delayMs = 300) {
  let timer: any;
  return effect((onCleanup) => {
    const value = source();
    untracked(() => {
      clearTimeout(timer);
      timer = setTimeout(() => callback(value), delayMs);
    });
    onCleanup(() => clearTimeout(timer));
  });
}`,
      codeHtml: `<span class="c-kw">export function</span> <span class="c-fn">debouncedEffect</span>&lt;<span class="c-typ">T</span>&gt;(source: <span class="c-typ">Signal</span>&lt;<span class="c-typ">T</span>&gt;, callback: (val: <span class="c-typ">T</span>) =&gt; <span class="c-typ">void</span>, delayMs = <span class="c-bool">300</span>) {
  <span class="c-kw">let</span> timer: <span class="c-typ">any</span>;
  <span class="c-kw">return</span> <span class="c-fn">effect</span>((onCleanup) =&gt; {
    <span class="c-kw">const</span> value = <span class="c-fn">source</span>();
    <span class="c-fn">untracked</span>(() =&gt; {
      <span class="c-fn">clearTimeout</span>(timer);
      timer = <span class="c-fn">setTimeout</span>(() =&gt; <span class="c-fn">callback</span>(value), delayMs);
    });
    <span class="c-fn">onCleanup</span>(() =&gt; <span class="c-fn">clearTimeout</span>(timer));
  });
}`,
      tags: ['Angular', 'Signals', 'Utility'],
      lastUsed: '10m ago',
      isFavorite: true
    },
    {
      id: 2,
      title: 'Go HMAC-SHA256 Webhook Signature Validator',
      filename: 'webhook_validator.go',
      language: 'go',
      languageLabel: 'Go',
      description: 'Constant-time cryptographic signature verification for payment callbacks.',
      rawCode: `func VerifyHMAC(payload, signature, secret []byte) bool {
	mac := hmac.New(sha256.New, secret)
	mac.Write(payload)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expectedMAC), signature)
}`,
      codeHtml: `<span class="c-kw">func</span> <span class="c-fn">VerifyHMAC</span>(payload, signature, secret []<span class="c-typ">byte</span>) <span class="c-typ">bool</span> {
	mac := hmac.<span class="c-fn">New</span>(sha256.New, secret)
	mac.<span class="c-fn">Write</span>(payload)
	expectedMAC := hex.<span class="c-fn">EncodeToString</span>(mac.<span class="c-fn">Sum</span>(<span class="c-bool">nil</span>))
	<span class="c-kw">return</span> hmac.<span class="c-fn">Equal</span>([]<span class="c-typ">byte</span>(expectedMAC), signature)
}`,
      tags: ['Go', 'Security', 'Fintech'],
      lastUsed: '1h ago',
      isFavorite: true
    },
    {
      id: 3,
      title: 'PostgreSQL Upsert with Conflict Handling',
      filename: 'upsert_profile.sql',
      language: 'sql',
      languageLabel: 'SQL',
      description: 'Atomic upsert query pattern with returning mutated rows in PostgreSQL.',
      rawCode: `INSERT INTO user_profiles (github_id, username, email, updated_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (github_id)
DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  updated_at = NOW()
RETURNING id, username, updated_at;`,
      codeHtml: `<span class="c-kw">INSERT INTO</span> user_profiles (github_id, username, email, updated_at)
<span class="c-kw">VALUES</span> ($1, $2, $3, <span class="c-fn">NOW</span>())
<span class="c-kw">ON CONFLICT</span> (github_id)
<span class="c-kw">DO UPDATE SET</span>
  username = <span class="c-typ">EXCLUDED</span>.username,
  email = <span class="c-typ">EXCLUDED</span>.email,
  updated_at = <span class="c-fn">NOW</span>()
<span class="c-kw">RETURNING</span> id, username, updated_at;`,
      tags: ['SQL', 'Postgres', 'Database'],
      lastUsed: 'Yesterday',
      isFavorite: true
    },
    {
      id: 4,
      title: 'Multi-stage Production Dockerfile for Go',
      filename: 'Dockerfile.prod',
      language: 'docker',
      languageLabel: 'Docker',
      description: 'Scratch-based minimal container build reducing image size from 800MB to 12MB.',
      rawCode: `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]`,
      codeHtml: `<span class="c-kw">FROM</span> golang:1.22-alpine <span class="c-kw">AS</span> builder
<span class="c-kw">WORKDIR</span> /app
<span class="c-kw">COPY</span> go.mod go.sum ./
<span class="c-kw">RUN</span> go mod download
<span class="c-kw">COPY</span> . .
<span class="c-kw">RUN</span> CGO_ENABLED=0 GOOS=linux go build -ldflags=<span class="c-str">"-w -s"</span> -o server .

<span class="c-kw">FROM</span> scratch
<span class="c-kw">COPY</span> --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
<span class="c-kw">COPY</span> --from=builder /app/server /server
<span class="c-kw">ENTRYPOINT</span> [<span class="c-str">"/server"</span>]`,
      tags: ['Docker', 'MultiStage', 'DevOps'],
      lastUsed: '2d ago',
      isFavorite: true
    }
  ]);

  // 4. Lọc danh sách Favorites
  filteredFavorites = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.favoritesList().filter(s => {
      return (
        s.isFavorite &&
        (!q ||
          s.title.toLowerCase().includes(q) ||
          s.filename.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some(t => t.toLowerCase().includes(q)))
      );
    });
  });

  // Toggle Favorite
  toggleFavorite(id: number) {
    this.favoritesList.update(list =>
      list.map(s => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  }

  // 1-Click Copy vào Clipboard
  copyCode(snippet: FavoriteSnippet) {
    navigator.clipboard.writeText(snippet.rawCode).then(() => {
      this.copiedSnippetId.set(snippet.id);
      setTimeout(() => {
        if (this.copiedSnippetId() === snippet.id) {
          this.copiedSnippetId.set(null);
        }
      }, 1500);
    });
  }
}
export interface SnippetItem {
  id: number;
  title: string;
  filename: string;
  language: 'typescript' | 'go' | 'sql' | 'docker' | 'shell' | 'css';
  languageLabel: string;
  description: string;
  codeHtml: string;
  rawCode: string;
  tags: string[];
  lastUsed: string;
  copied?: boolean;
}

export const DEMO_SNIPPETS: SnippetItem[] = [
    {
      id: 1,
      title: 'Angular 17 Debounced Signal Effect',
      filename: 'debounce-effect.util.ts',
      language: 'typescript',
      languageLabel: 'TypeScript',
      description: 'Custom helper to execute side-effects with a debounce delay on signal value changes.',
      rawCode: `import { effect, Signal, untracked } from '@angular/core';

export function debouncedEffect<T>(
  source: Signal<T>,
  callback: (val: T) => void,
  delayMs = 300
) {
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
      codeHtml: `<span class="c-kw">import</span> { effect, Signal, untracked } <span class="c-kw">from</span> <span class="c-str">'@angular/core'</span>;

<span class="c-kw">export function</span> <span class="c-fn">debouncedEffect</span>&lt;<span class="c-typ">T</span>&gt;(
  source: <span class="c-typ">Signal</span>&lt;<span class="c-typ">T</span>&gt;,
  callback: (val: <span class="c-typ">T</span>) =&gt; <span class="c-typ">void</span>,
  delayMs = <span class="c-bool">300</span>
) {
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
      tags: ['Angular 17', 'Signals', 'Debounce', 'Performance'],
      lastUsed: '10m ago'
    },
    {
      id: 2,
      title: 'Go HMAC-SHA256 Webhook Signature Validator',
      filename: 'webhook_validator.go',
      language: 'go',
      languageLabel: 'Go',
      description: 'Cryptographic HMAC-SHA256 signature verification for GitHub & Payment webhooks.',
      rawCode: `package security

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

func VerifyHMAC(payload, signature, secret []byte) bool {
	mac := hmac.New(sha256.New, secret)
	mac.Write(payload)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expectedMAC), signature)
}`,
      codeHtml: `<span class="c-kw">package</span> security

<span class="c-kw">import</span> (
	<span class="c-str">"crypto/hmac"</span>
	<span class="c-str">"crypto/sha256"</span>
	<span class="c-str">"encoding/hex"</span>
)

<span class="c-kw">func</span> <span class="c-fn">VerifyHMAC</span>(payload, signature, secret []<span class="c-typ">byte</span>) <span class="c-typ">bool</span> {
	mac := hmac.<span class="c-fn">New</span>(sha256.New, secret)
	mac.<span class="c-fn">Write</span>(payload)
	expectedMAC := hex.<span class="c-fn">EncodeToString</span>(mac.<span class="c-fn">Sum</span>(<span class="c-bool">nil</span>))
	<span class="c-kw">return</span> hmac.<span class="c-fn">Equal</span>([]<span class="c-typ">byte</span>(expectedMAC), signature)
}`,
      tags: ['Go', 'Security', 'HMAC', 'Webhook'],
      lastUsed: '1h ago'
    },
    {
      id: 3,
      title: 'PostgreSQL Upsert with Conflict Target & Audit Timestamp',
      filename: 'upsert_user_profile.sql',
      language: 'sql',
      languageLabel: 'SQL',
      description: 'Atomic upsert query pattern maintaining created_at and updated_at triggers.',
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
      tags: ['PostgreSQL', 'SQL', 'Upsert', 'Database'],
      lastUsed: 'Yesterday'
    },
    {
      id: 4,
      title: 'Multi-stage Docker Build for Minimal Go Binary',
      filename: 'Dockerfile.prod',
      language: 'docker',
      languageLabel: 'Docker',
      description: 'Scratch-based ultra lightweight Go container image with CA certificates.',
      rawCode: `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server
EXPOSE 8080
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
<span class="c-kw">EXPOSE</span> <span class="c-bool">8080</span>
<span class="c-kw">ENTRYPOINT</span> [<span class="c-str">"/server"</span>]`,
      tags: ['Docker', 'MultiStage', 'Go', 'DevOps'],
      lastUsed: '3d ago'
    }
  ];

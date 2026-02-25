# magic-favicon

![npm version](https://img.shields.io/npm/v/magic-favicon)
![CI](https://github.com/arindamdawn/magic-favicon/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/github/license/arindamdawn/magic-favicon)

Tiny, dependency-free favicon state indicators for modern web apps.

`magic-favicon` turns your tab icon into a compact status surface for progress, notifications, health states, and activity animation without mutating the page title.

Current size snapshot: **~2.5KB gzipped** (core ESM build measured on **February 25, 2026**).

## Why this library

- Tiny runtime footprint (optimized for strict size budgets)
- Zero runtime dependencies
- TypeScript-first API
- Modern outputs: ESM, CJS, UMD
- Works in background tabs with worker-backed ticker fallback logic
- High-DPI aware canvas rendering for sharper badge text/icons

## Features

| Capability | Method | Notes |
|---|---|---|
| Progress bar | `progress(value)` | Horizontal bottom bar, clamped `0..100` |
| Pie progress | `pie(value)` | Circular ring progress, clamped `0..100` |
| Badge count | `badge(count)` | Auto formats to `99+` |
| Status indicator | `status(kindOrColor)` | Built-in states or custom color string |
| Pulse animation | `pulse(options)` | Soft radial activity pulse |
| Spin animation | `spin(options)` | Indeterminate ring spinner |
| Reset | `reset()` / `clear()` | Restores original favicon |
| Global defaults | `setDefaults(options)` | Reuse shared config across calls |

## Install

```bash
npm install magic-favicon
```

## Quick start

```ts
import favicon from "magic-favicon";

favicon.progress(35);
favicon.pie(72);
favicon.badge(5);
favicon.status("warning");
favicon.status("#7c3aed"); // custom status color
favicon.pulse();
favicon.spin();
favicon.reset();

favicon.badge(8, { sizeRatio: 1.25 });
```

## Framework recipes

All framework integrations follow the same rule: call `magic-favicon` only on the client.

### React 19+

```tsx
import { useEffect } from "react";
import favicon from "magic-favicon";

export function UploadTabStatus({ progress }: { progress: number }) {
  useEffect(() => {
    favicon.progress(progress, { preserveBase: true });
    return () => favicon.reset();
  }, [progress]);

  return null;
}
```

### Next.js (App Router)

```tsx
"use client";

import { useEffect } from "react";
import favicon from "magic-favicon";

export default function RealtimeIndicator() {
  useEffect(() => {
    favicon.spin({ color: "#f59e0b" });
    return () => favicon.reset();
  }, []);

  return null;
}
```

### Angular v21 (standalone + signals)

```ts
import { Component, DestroyRef, effect, inject, PLATFORM_ID, signal } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import favicon from "magic-favicon";

@Component({
  selector: "app-upload-status",
  standalone: true,
  template: `{{ progress() }}%`
})
export class UploadStatusComponent {
  progress = signal(0);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    effect(() => {
      favicon.progress(this.progress());
    });

    this.destroyRef.onDestroy(() => favicon.reset());
  }
}
```

### Vue 3+

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import favicon from "magic-favicon";

onMounted(() => favicon.badge(6, { preserveBase: true }));
onBeforeUnmount(() => favicon.reset());
</script>
```

### Nuxt 3+

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import favicon from "magic-favicon";

onMounted(() => favicon.status("success"));
onBeforeUnmount(() => favicon.reset());
</script>
```

### SvelteKit / Svelte 5

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import favicon from "magic-favicon";

  onMount(() => {
    favicon.pulse({ preserveBase: true });
    return () => favicon.reset();
  });
</script>
```

## API

### `setDefaults(options)`
Set global defaults merged into subsequent method calls.

```ts
favicon.setDefaults({
  preserveBase: true,
  color: "#0ea5e9",
  trackColor: "rgba(0,0,0,0.25)",
  lineWidth: 4
});
```

### `progress(value, options?)`

Options:
- `color?: string`
- `trackColor?: string`
- `heightRatio?: number` (`0.1..0.6`)
- `sizeRatio?: number` (`0.4..1.6`)
- `preserveBase?: boolean`

### `pie(value, options?)`

Options:
- `color?: string`
- `trackColor?: string`
- `lineWidth?: number` (`2..10`)
- `sizeRatio?: number` (`0.4..1.6`)
- `preserveBase?: boolean`

### `badge(count, options?)`

Options:
- `bgColor?: string`
- `textColor?: string`
- `position?: 'tr' | 'tl' | 'br' | 'bl'`
- `sizeRatio?: number` (`0.4..1.6`)
- `preserveBase?: boolean`

Behavior:
- `count <= 0` triggers reset
- `count > 99` displays `99+`

### `status(kindOrColor, options?)`

`kindOrColor` can be:
- `'success'`
- `'warning'`
- `'error'`
- any CSS color string (custom)

Options:
- `successColor?: string`
- `warningColor?: string`
- `errorColor?: string`
- `shape?: 'dot' | 'ring' | 'square'`
- `ringWidth?: number`
- `sizeRatio?: number` (`0.4..1.6`)
- `preserveBase?: boolean`

### `pulse(options?)` and `spin(options?)`

Options:
- `color?: string`
- `periodMs?: number` (min `300`)
- `tickMs?: number` (min `16`)
- `lineWidth?: number` (`spin` ring width)
- `sizeRatio?: number` (`0.4..1.6`)
- `preserveBase?: boolean`

### `reset()`, `clear()`, `destroy()`

- `reset()` restores original favicon attributes.
- `clear()` is an alias for `reset()`.
- `destroy()` stops running animations.

### Factory API

```ts
import { createMagicFavicon } from "magic-favicon";

const faviconA = createMagicFavicon();
const faviconB = createMagicFavicon();
```

## Real-world patterns

### Upload progress

```ts
favicon.progress(0);

upload.on("progress", (p: number) => {
  favicon.progress(p);
});

upload.on("done", () => {
  favicon.status("success");
});
```

### Notifications

```ts
favicon.badge(unreadCount, { bgColor: "#dc2626" });
```

### Live connection state

```ts
socket.on("open", () => favicon.status("success"));
socket.on("reconnecting", () => favicon.spin({ color: "#f59e0b" }));
socket.on("error", () => favicon.status("error"));
```

## Browser support

Modern evergreen browsers with Canvas API support.

## Local development

```bash
pnpm install
pnpm run build
pnpm run test
pnpm run size
pnpm run size:check
pnpm run dev
```

- Demo app: `demo/`
- Source: `src/index.ts`

## Size policy

The project includes a gzip size check script and enforces a hard budget of **5KB max** for `dist/index.js.gz`.

- Latest measured size: **2503 bytes gzipped** (February 25, 2026)
- CI fails if size exceeds the 5KB budget

## Release workflow (Changesets + pnpm)

```bash
pnpm changeset
```

Then commit the generated file under `.changeset/`.

On `main` pushes, GitHub Actions will:
1. run `pnpm run check`
2. open/update a release PR if unpublished changesets exist
3. publish to npm when the release PR is merged

Required GitHub repository secrets:
- `NPM_TOKEN`

## License

MIT

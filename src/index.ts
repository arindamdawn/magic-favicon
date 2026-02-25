type StatusKind = "success" | "warning" | "error";

export interface SharedOptions {
  preserveBase?: boolean;
  sizeRatio?: number;
}

export interface ProgressOptions extends SharedOptions {
  color?: string;
  trackColor?: string;
  heightRatio?: number;
}

export interface PieOptions extends SharedOptions {
  color?: string;
  trackColor?: string;
  lineWidth?: number;
}

export interface BadgeOptions extends SharedOptions {
  bgColor?: string;
  textColor?: string;
  position?: "tr" | "tl" | "br" | "bl";
}

export interface StatusOptions extends SharedOptions {
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  shape?: "dot" | "ring" | "square";
  ringWidth?: number;
}

export interface PulseOptions extends SharedOptions {
  color?: string;
  periodMs?: number;
  tickMs?: number;
  lineWidth?: number;
}

export type Defaults = Partial<ProgressOptions & PieOptions & BadgeOptions & StatusOptions & PulseOptions>;

const SIZE = 32;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const badgeText = (count: number): string => (count > 99 ? "99+" : String(Math.round(count)));

const isSafeBase = (href: string): boolean => {
  if (!href) return false;
  if (href.startsWith("data:") || href.startsWith("blob:")) return true;
  try {
    return new URL(href, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

class Ticker {
  private worker: Worker | null = null;
  private intervalId = 0;
  private callback: (() => void) | null = null;
  private workerUrl = "";

  start(callback: () => void, intervalMs: number): void {
    this.stop();
    this.callback = callback;

    if (typeof Worker === "function" && typeof Blob === "function") {
      const source =
        "let t=0;onmessage=e=>{const d=e.data;if(d&&d.s){clearInterval(t);t=setInterval(()=>postMessage(1),d.s)}else{clearInterval(t);t=0}}";
      this.workerUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
      this.worker = new Worker(this.workerUrl);
      this.worker.onmessage = () => this.callback?.();
      this.worker.postMessage({ s: intervalMs });
      return;
    }

    this.intervalId = window.setInterval(() => this.callback?.(), intervalMs);
  }

  stop(): void {
    if (this.worker) {
      this.worker.postMessage(0);
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerUrl) {
      URL.revokeObjectURL(this.workerUrl);
      this.workerUrl = "";
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = 0;
    }
  }
}

export class MagicFavicon {
  private link: HTMLLinkElement;
  private originalHref: string | null;
  private originalRel: string;
  private originalType: string;
  private originalImage: HTMLImageElement | null = null;
  private ticker = new Ticker();
  private animationMode: "" | "pulse" | "spin" = "";
  private animationStart = 0;
  private defaults: Defaults = {};
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private pixelRatio: number;

  constructor() {
    this.link = this.ensureFaviconLink();
    this.originalHref = this.link.getAttribute("href");
    this.originalRel = this.link.getAttribute("rel") || "icon";
    this.originalType = this.link.getAttribute("type") || "";

    this.canvas = document.createElement("canvas");
    this.pixelRatio = clamp(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1, 2);
    this.canvas.width = Math.round(SIZE * this.pixelRatio);
    this.canvas.height = Math.round(SIZE * this.pixelRatio);
    this.ctx = this.canvas.getContext("2d");
    if (this.ctx) this.ctx.scale(this.pixelRatio, this.pixelRatio);

    this.warmOriginalImage();
  }

  setDefaults(options: Defaults = {}): this {
    this.defaults = { ...this.defaults, ...options };
    return this;
  }

  progress(value: number, options: ProgressOptions = {}): this {
    const percent = clamp(value, 0, 100) / 100;
    const color = options.color ?? this.defaults.color ?? "#0ea5e9";
    const trackColor = options.trackColor ?? this.defaults.trackColor ?? "rgba(0, 0, 0, 0.25)";
    const height = clamp(options.heightRatio ?? this.defaults.heightRatio ?? 0.22, 0.1, 0.6);
    const scale = clamp(options.sizeRatio ?? this.defaults.sizeRatio ?? 1, 0.4, 1.6);

    this.render(
      (ctx, size) => {
        const barHeight = Math.round(size * height * scale);
        const barWidth = Math.round(size * Math.min(scale, 1));
        const x = Math.round((size - barWidth) / 2);
        const y = size - barHeight;
        ctx.fillStyle = trackColor;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.round(barWidth * percent), barHeight);
      },
      options.preserveBase
    );

    return this;
  }

  pie(value: number, options: PieOptions = {}): this {
    const percent = clamp(value, 0, 100) / 100;
    const color = options.color ?? this.defaults.color ?? "#22c55e";
    const trackColor = options.trackColor ?? this.defaults.trackColor ?? "rgba(0, 0, 0, 0.2)";
    const scale = clamp(options.sizeRatio ?? this.defaults.sizeRatio ?? 1, 0.4, 1.6);
    const lineWidth = clamp((options.lineWidth ?? this.defaults.lineWidth ?? 5) * scale, 1, 12);

    this.render(
      (ctx, size) => {
        const c = size / 2;
        const r = (c - lineWidth / 2) * Math.min(scale, 1);
        ctx.lineWidth = lineWidth;

        ctx.strokeStyle = trackColor;
        ctx.beginPath();
        ctx.arc(c, c, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(c, c, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
        ctx.stroke();
      },
      options.preserveBase
    );

    return this;
  }

  badge(count: number, options: BadgeOptions = {}): this {
    if (count <= 0) return this.reset();

    const text = badgeText(count);
    const bgColor = options.bgColor ?? this.defaults.bgColor ?? "#ef4444";
    const textColor = options.textColor ?? this.defaults.textColor ?? "#ffffff";
    const scale = clamp(options.sizeRatio ?? this.defaults.sizeRatio ?? 1, 0.4, 1.6);

    this.render(
      (ctx, size) => {
        const radius = Math.round(size * 0.26 * scale);
        const position = options.position ?? "tr";
        const x = position === "tl" || position === "bl" ? radius + 1 : size - radius - 1;
        const y = position === "bl" || position === "br" ? size - radius - 1 : radius + 1;

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let fontPx = Math.max(
          7,
          Math.round(radius * (text.length > 2 ? 0.95 : text.length === 2 ? 1.15 : 1.35))
        );
        ctx.font = `bold ${fontPx}px sans-serif`;
        if (ctx.measureText) {
          let width = ctx.measureText(text).width;
          while (fontPx > 7 && width > radius * 1.65) {
            fontPx -= 1;
            ctx.font = `bold ${fontPx}px sans-serif`;
            width = ctx.measureText(text).width;
          }
        }
        ctx.fillText(text, x, y + 0.5);
      },
      options.preserveBase
    );

    return this;
  }

  status(kindOrColor: StatusKind | string, options: StatusOptions = {}): this {
    const kind = kindOrColor as StatusKind;
    const color =
      kind === "success"
        ? options.successColor ?? this.defaults.successColor ?? "#22c55e"
        : kind === "warning"
          ? options.warningColor ?? this.defaults.warningColor ?? "#f59e0b"
          : kind === "error"
            ? options.errorColor ?? this.defaults.errorColor ?? "#ef4444"
            : kindOrColor;

    this.render(
      (ctx, size) => {
        const scale = clamp(options.sizeRatio ?? this.defaults.sizeRatio ?? 1, 0.4, 1.6);
        const r = Math.round(size * 0.18 * scale);
        const x = size - r - 2;
        const y = size - r - 2;
        const shape = options.shape ?? "dot";
        ctx.fillStyle = color;
        if (shape === "square") {
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
          return;
        }
        if (shape === "ring") {
          const ringWidth = clamp(options.ringWidth ?? this.defaults.ringWidth ?? 3, 1, 8);
          ctx.strokeStyle = color;
          ctx.lineWidth = ringWidth;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
          return;
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      },
      options.preserveBase
    );

    return this;
  }

  pulse(options: PulseOptions = {}): this {
    return this.animate("pulse", options);
  }

  spin(options: PulseOptions = {}): this {
    return this.animate("spin", options);
  }

  clear(): this {
    return this.reset();
  }

  reset(): this {
    this.stopAnimation();

    if (this.originalHref) {
      this.link.setAttribute("href", this.originalHref);
    } else {
      this.link.removeAttribute("href");
    }

    this.link.setAttribute("rel", this.originalRel || "icon");
    if (this.originalType) {
      this.link.setAttribute("type", this.originalType);
    } else {
      this.link.removeAttribute("type");
    }

    return this;
  }

  destroy(): void {
    this.stopAnimation();
  }

  private animate(mode: "pulse" | "spin", options: PulseOptions): this {
    this.stopAnimation();
    this.animationMode = mode;
    this.animationStart = performance.now();

    const color = options.color ?? this.defaults.color ?? "#3b82f6";
    const periodMs = Math.max(300, options.periodMs ?? this.defaults.periodMs ?? 1300);
    const tickMs = Math.max(16, options.tickMs ?? this.defaults.tickMs ?? 80);
    const scale = clamp(options.sizeRatio ?? this.defaults.sizeRatio ?? 1, 0.4, 1.6);
    const lineWidth = clamp((options.lineWidth ?? this.defaults.lineWidth ?? 4) * scale, 1, 12);
    const preserveBase = (options.preserveBase ?? this.defaults.preserveBase) !== false;

    this.ticker.start(() => {
      const elapsed = performance.now() - this.animationStart;
      const phase = (elapsed % periodMs) / periodMs;

      this.renderFrame(
        (ctx, size) => {
          const c = size / 2;
          if (this.animationMode === "pulse") {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.22 + 0.7 * Math.sin(phase * Math.PI);
            ctx.beginPath();
            ctx.arc(c, c, size * 0.42 * Math.min(scale, 1.4), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            return;
          }

          const start = phase * Math.PI * 2 - Math.PI / 2;
          const end = start + Math.PI * 1.4;
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.arc(c, c, (c - lineWidth / 2 - 1) * Math.min(scale, 1), start, end);
          ctx.stroke();
        },
        preserveBase
      );
    }, tickMs);

    return this;
  }

  private render(draw: (ctx: CanvasRenderingContext2D, size: number) => void, preserveBase?: boolean): void {
    this.stopAnimation();
    this.renderFrame(draw, (preserveBase ?? this.defaults.preserveBase) !== false);
  }

  private renderFrame(draw: (ctx: CanvasRenderingContext2D, size: number) => void, preserveBase: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);
    if (preserveBase && this.originalImage) {
      ctx.drawImage(this.originalImage, 0, 0, SIZE, SIZE);
    }

    draw(ctx, SIZE);
    this.setFavicon();
  }

  private stopAnimation(): void {
    if (!this.animationMode) return;
    this.animationMode = "";
    this.ticker.stop();
  }

  private warmOriginalImage(): void {
    if (!this.originalHref || !isSafeBase(this.originalHref)) return;
    const image = new Image();
    image.onload = () => {
      this.originalImage = image;
    };
    image.src = this.originalHref;
  }

  private setFavicon(): void {
    try {
      const url = this.canvas.toDataURL("image/png");
      this.link.setAttribute("rel", "icon");
      this.link.setAttribute("type", "image/png");
      this.link.setAttribute("href", url);
    } catch {
      // Ignore tainted canvas updates.
    }
  }

  private ensureFaviconLink(): HTMLLinkElement {
    const existing = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (existing) return existing;

    const link = document.createElement("link");
    link.setAttribute("rel", "icon");
    document.head.appendChild(link);
    return link;
  }
}

export const createMagicFavicon = (): MagicFavicon => new MagicFavicon();
const singleton = new MagicFavicon();
export default singleton;

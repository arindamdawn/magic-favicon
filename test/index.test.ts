import { describe, expect, it, vi } from "vitest";

const load = async () => {
  vi.resetModules();
  return import("../src/index");
};

describe("magic-favicon", () => {
  it("renders and resets all primary modes", async () => {
    document.head.innerHTML = '<link rel="icon" type="image/x-icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    f.progress(55)
      .pie(70)
      .badge(4)
      .status("success")
      .status("warning")
      .status("error")
      .status("#123456");

    const link = document.querySelector('link[rel~="icon"]');
    expect(link?.getAttribute("href")).toBe("data:image/png;base64,MOCK");
    expect(globalThis.__mockCanvasCtx.fillText).toHaveBeenCalled();
    expect(globalThis.__mockCanvasCtx.stroke).toHaveBeenCalled();

    f.reset();
    expect(link?.getAttribute("href")).toBe("/icon.ico");
    expect(link?.getAttribute("type")).toBe("image/x-icon");
  });

  it("uses defaults and clamp bounds", async () => {
    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    f.setDefaults({ color: "#ff0000", trackColor: "#000000", lineWidth: 99, heightRatio: 0.01, preserveBase: false });
    f.progress(999);
    f.pie(-20);
    expect(globalThis.__mockCanvasCtx.fillRect).toHaveBeenCalled();
    expect(globalThis.__mockCanvasCtx.arc).toHaveBeenCalled();
  });

  it("formats badge counts and handles clear/reset alias", async () => {
    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    f.badge(120);
    expect(globalThis.__mockCanvasCtx.fillText).toHaveBeenCalledWith("99+", expect.any(Number), expect.any(Number));

    f.badge(0);
    const link = document.querySelector('link[rel~="icon"]');
    expect(link?.getAttribute("href")).toBe("/icon.ico");

    f.clear();
    expect(link?.getAttribute("href")).toBe("/icon.ico");
  });

  it("supports badge positions and status shape variants", async () => {
    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    globalThis.__mockCanvasCtx.arc.mockClear();
    f.badge(7, { position: "bl" });
    const badgeArcArgs = globalThis.__mockCanvasCtx.arc.mock.calls.at(-1);
    expect(badgeArcArgs?.[0]).toBeLessThan(16);
    expect(badgeArcArgs?.[1]).toBeGreaterThan(16);

    globalThis.__mockCanvasCtx.fillRect.mockClear();
    f.status("success", { shape: "square" });
    expect(globalThis.__mockCanvasCtx.fillRect).toHaveBeenCalled();

    globalThis.__mockCanvasCtx.stroke.mockClear();
    f.status("warning", { shape: "ring", ringWidth: 4 });
    expect(globalThis.__mockCanvasCtx.stroke).toHaveBeenCalled();
  });

  it("applies sizeRatio across render types", async () => {
    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    globalThis.__mockCanvasCtx.fillRect.mockClear();
    f.progress(50, { sizeRatio: 0.5 });
    const progressWidth = globalThis.__mockCanvasCtx.fillRect.mock.calls[0][2];
    expect(progressWidth).toBeLessThan(32);

    globalThis.__mockCanvasCtx.arc.mockClear();
    f.pie(50, { sizeRatio: 0.6 });
    const pieRadius = globalThis.__mockCanvasCtx.arc.mock.calls[0][2];
    expect(pieRadius).toBeLessThan(16);

    globalThis.__mockCanvasCtx.arc.mockClear();
    f.badge(8, { sizeRatio: 1.4 });
    const badgeRadius = globalThis.__mockCanvasCtx.arc.mock.calls[0][2];
    expect(badgeRadius).toBeGreaterThan(8);

    f.destroy();
  });

  it("uses high-DPI canvas scaling and adaptive badge text sizing", async () => {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    expect(globalThis.__mockCanvasCtx.scale).toHaveBeenCalledWith(2, 2);

    globalThis.__mockCanvasCtx.measureText.mockImplementation((text: string) => ({ width: text.length * 30 }));
    f.badge(999, { sizeRatio: 0.5 });
    expect(globalThis.__mockCanvasCtx.measureText).toHaveBeenCalled();
  });

  it("creates favicon link when missing and keeps it after reset", async () => {
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    f.progress(10);
    let link = document.querySelector('link[rel~="icon"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("data:image/png;base64,MOCK");

    f.reset();
    link = document.querySelector('link[rel~="icon"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBeNull();
    expect(link?.getAttribute("rel")).toBe("icon");
  });

  it("loads base image for same-origin/data/blob icons", async () => {
    const imageSources: string[] = [];
    class MockImage {
      onload: (() => void) | null = null;
      set src(value: string) {
        imageSources.push(value);
        this.onload?.();
      }
    }
    vi.stubGlobal("Image", MockImage as unknown as typeof Image);

    document.head.innerHTML = '<link rel="icon" href="/safe.ico" />';
    const { createMagicFavicon } = await load();
    const f1 = createMagicFavicon();
    f1.progress(20);

    document.head.innerHTML = '<link rel="icon" href="data:image/png;base64,AA" />';
    const f2 = createMagicFavicon();
    f2.progress(20);

    document.head.innerHTML = '<link rel="icon" href="blob:xyz" />';
    const f3 = createMagicFavicon();
    f3.progress(20);

    expect(imageSources.length).toBeGreaterThanOrEqual(3);
    expect(globalThis.__mockCanvasCtx.drawImage).toHaveBeenCalled();
  });

  it("skips base image when url is unsafe or invalid", async () => {
    const imageSources: string[] = [];
    class MockImage {
      onload: (() => void) | null = null;
      set src(value: string) {
        imageSources.push(value);
        this.onload?.();
      }
    }
    vi.stubGlobal("Image", MockImage as unknown as typeof Image);

    document.head.innerHTML = '<link rel="icon" href="https://evil.example.com/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f1 = createMagicFavicon();
    f1.progress(20);

    document.head.innerHTML = '<link rel="icon" href="http://[::1" />';
    const f2 = createMagicFavicon();
    f2.progress(20);

    expect(imageSources).toEqual([]);
    expect(globalThis.__mockCanvasCtx.drawImage).not.toHaveBeenCalled();
  });

  it("handles tainted canvas errors gracefully", async () => {
    const toData = HTMLCanvasElement.prototype.toDataURL;
    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: () => {
        throw new Error("tainted");
      }
    });

    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();
    expect(() => f.progress(40)).not.toThrow();

    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: toData
    });
  });

  it("no-ops when canvas context is unavailable", async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => null
    });

    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();
    expect(() => f.progress(10).pie(10).badge(10).status("success")).not.toThrow();

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => globalThis.__mockCanvasCtx as unknown as CanvasRenderingContext2D
    });
  });

  it("uses worker ticker and cleans resources", async () => {
    const workers: MockWorker[] = [];
    class MockWorker {
      onmessage: (() => void) | null = null;
      terminated = false;
      messages: unknown[] = [];
      constructor(public url: string) {
        workers.push(this);
      }
      postMessage(message: unknown) {
        this.messages.push(message);
      }
      terminate() {
        this.terminated = true;
      }
      emit() {
        this.onmessage?.();
      }
    }

    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:worker");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);

    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    f.pulse({ tickMs: 32, periodMs: 400 });
    expect(workers).toHaveLength(1);
    expect(workers[0].messages[0]).toEqual({ s: 32 });

    workers[0].emit();
    expect(globalThis.__mockCanvasCtx.fill).toHaveBeenCalled();

    f.spin({ tickMs: 50, periodMs: 600, lineWidth: 3 });
    expect(workers).toHaveLength(2);
    workers[1].emit();
    expect(globalThis.__mockCanvasCtx.stroke).toHaveBeenCalled();

    f.progress(10);
    expect(workers[1].terminated).toBe(true);
    expect(workers[1].messages.at(-1)).toBe(0);
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it("falls back to interval ticker when worker is unavailable", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", undefined);

    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const { createMagicFavicon } = await load();
    const f = createMagicFavicon();

    f.pulse({ tickMs: 20, periodMs: 300 });
    vi.advanceTimersByTime(80);
    expect(globalThis.__mockCanvasCtx.fill).toHaveBeenCalled();

    f.destroy();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("default export is usable", async () => {
    document.head.innerHTML = '<link rel="icon" href="/icon.ico" />';
    const mod = await load();
    expect(() => mod.default.progress(15).reset()).not.toThrow();
  });
});

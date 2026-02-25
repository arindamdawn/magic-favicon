import { afterEach, beforeEach, vi } from "vitest";

type MockCtx = {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  globalAlpha: number;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  font: string;
  fillRect: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  measureText: ReturnType<typeof vi.fn>;
};

declare global {
  // eslint-disable-next-line no-var
  var __mockCanvasCtx: MockCtx;
}

const createCtx = (): MockCtx => ({
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
  globalAlpha: 1,
  textAlign: "start",
  textBaseline: "alphabetic",
  font: "",
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  scale: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 8 }))
});

globalThis.__mockCanvasCtx = createCtx();

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: () => globalThis.__mockCanvasCtx as unknown as CanvasRenderingContext2D
});

Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
  configurable: true,
  writable: true,
  value: vi.fn(() => "data:image/png;base64,MOCK")
});

if (!URL.createObjectURL) {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => "blob:mock")
  });
}

if (!URL.revokeObjectURL) {
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn()
  });
}

beforeEach(() => {
  globalThis.__mockCanvasCtx = createCtx();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

import favicon from "../src/index";

type StatusKind = "success" | "warning" | "error";

let progressTimer: number | null = null;
let suiteTimers: number[] = [];

const input = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Missing demo element: ${id}`);
  return el;
};

const setOutput = (id: string, value: string): void => {
  input<HTMLOutputElement>(id).value = value;
};

const log = (message: string): void => {
  input<HTMLParagraphElement>("log").textContent = message;
};

const bindRangeOutput = (rangeId: string, outputId: string): void => {
  const range = input<HTMLInputElement>(rangeId);
  const sync = () => setOutput(outputId, range.value);
  sync();
  range.addEventListener("input", sync);
};

bindRangeOutput("progress", "progress-out");
bindRangeOutput("progress-height", "progress-height-out");
bindRangeOutput("progress-size", "progress-size-out");
bindRangeOutput("pie", "pie-out");
bindRangeOutput("pie-width", "pie-width-out");
bindRangeOutput("pie-size", "pie-size-out");
bindRangeOutput("badge", "badge-out");
bindRangeOutput("badge-size", "badge-size-out");
bindRangeOutput("status-size", "status-size-out");
bindRangeOutput("pulse-size", "pulse-size-out");

const progressOptions = () => ({
  color: input<HTMLInputElement>("progress-color").value,
  trackColor: input<HTMLInputElement>("progress-track").value,
  heightRatio: Number(input<HTMLInputElement>("progress-height").value),
  sizeRatio: Number(input<HTMLInputElement>("progress-size").value),
  preserveBase: input<HTMLInputElement>("progress-base").checked
});

const pieOptions = () => ({
  color: input<HTMLInputElement>("pie-color").value,
  trackColor: input<HTMLInputElement>("pie-track").value,
  lineWidth: Number(input<HTMLInputElement>("pie-width").value),
  sizeRatio: Number(input<HTMLInputElement>("pie-size").value),
  preserveBase: input<HTMLInputElement>("pie-base").checked
});

const badgeOptions = () => ({
  bgColor: input<HTMLInputElement>("badge-bg").value,
  textColor: input<HTMLInputElement>("badge-text").value,
  sizeRatio: Number(input<HTMLInputElement>("badge-size").value),
  preserveBase: input<HTMLInputElement>("badge-base").checked
});

const statusOptions = () => ({
  successColor: input<HTMLInputElement>("status-success-color").value,
  warningColor: input<HTMLInputElement>("status-warning-color").value,
  errorColor: input<HTMLInputElement>("status-error-color").value,
  sizeRatio: Number(input<HTMLInputElement>("status-size").value),
  preserveBase: input<HTMLInputElement>("status-base").checked
});

const pulseOptions = () => ({
  color: input<HTMLInputElement>("pulse-color").value,
  periodMs: Number(input<HTMLInputElement>("pulse-period").value),
  tickMs: Number(input<HTMLInputElement>("pulse-tick").value),
  sizeRatio: Number(input<HTMLInputElement>("pulse-size").value),
  preserveBase: input<HTMLInputElement>("pulse-base").checked
});

const stopProgressSimulation = (): void => {
  if (progressTimer !== null) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
};

const stopSuite = (): void => {
  if (suiteTimers.length) {
    suiteTimers.forEach((timer) => clearTimeout(timer));
    suiteTimers = [];
  }
};

const applyStatus = (kind: StatusKind): void => {
  favicon.status(kind, statusOptions());
  log(`Applied ${kind} status`);
};

input<HTMLButtonElement>("apply-progress").addEventListener("click", () => {
  stopProgressSimulation();
  const value = Number(input<HTMLInputElement>("progress").value);
  favicon.progress(value, progressOptions());
  log(`Applied progress ${value}%`);
});

input<HTMLButtonElement>("simulate-progress").addEventListener("click", () => {
  stopProgressSimulation();
  stopSuite();
  let value = 0;
  const progress = input<HTMLInputElement>("progress");
  progress.value = String(value);
  setOutput("progress-out", String(value));
  log("Running progress simulation");

  progressTimer = window.setInterval(() => {
    favicon.progress(value, progressOptions());
    progress.value = String(value);
    setOutput("progress-out", String(value));
    value += 5;
    if (value > 100) {
      stopProgressSimulation();
      log("Progress simulation complete");
    }
  }, 180);
});

input<HTMLButtonElement>("apply-pie").addEventListener("click", () => {
  stopProgressSimulation();
  const value = Number(input<HTMLInputElement>("pie").value);
  favicon.pie(value, pieOptions());
  log(`Applied pie ${value}%`);
});

input<HTMLButtonElement>("apply-badge").addEventListener("click", () => {
  stopProgressSimulation();
  const count = Number(input<HTMLInputElement>("badge").value);
  favicon.badge(count, badgeOptions());
  log(`Applied badge ${count}`);
});

input<HTMLButtonElement>("status-success").addEventListener("click", () => applyStatus("success"));
input<HTMLButtonElement>("status-warning").addEventListener("click", () => applyStatus("warning"));
input<HTMLButtonElement>("status-error").addEventListener("click", () => applyStatus("error"));

input<HTMLButtonElement>("start-pulse").addEventListener("click", () => {
  stopProgressSimulation();
  favicon.pulse(pulseOptions());
  log("Started pulse");
});

input<HTMLButtonElement>("start-spin").addEventListener("click", () => {
  stopProgressSimulation();
  favicon.spin(pulseOptions());
  log("Started spin");
});

input<HTMLButtonElement>("stop-pulse").addEventListener("click", () => {
  stopProgressSimulation();
  favicon.reset();
  log("Stopped pulse and reset favicon");
});

input<HTMLButtonElement>("preset-upload").addEventListener("click", () => {
  stopProgressSimulation();
  favicon.progress(64, { color: "#2563eb", trackColor: "#0f172a", heightRatio: 0.2, preserveBase: true });
  log("Preset applied: Uploading");
});

input<HTMLButtonElement>("preset-alert").addEventListener("click", () => {
  stopProgressSimulation();
  favicon.badge(12, { bgColor: "#dc2626", textColor: "#ffffff", preserveBase: true });
  log("Preset applied: Alerts");
});

input<HTMLButtonElement>("preset-idle").addEventListener("click", () => {
  stopProgressSimulation();
  favicon.status("success", { successColor: "#16a34a", preserveBase: true });
  log("Preset applied: Idle");
});

input<HTMLButtonElement>("reset-all").addEventListener("click", () => {
  stopProgressSimulation();
  stopSuite();
  favicon.reset();
  log("Reset favicon");
});

input<HTMLButtonElement>("run-suite").addEventListener("click", () => {
  stopProgressSimulation();
  stopSuite();

  log("Running quick suite: progress -> pie -> badge -> status -> pulse");
  favicon.progress(35, { color: "#0284c7", trackColor: "#334155", heightRatio: 0.2 });

  suiteTimers.push(window.setTimeout(() => {
    favicon.pie(78, { color: "#16a34a", trackColor: "#64748b", lineWidth: 5 });
  }, 700));

  suiteTimers.push(window.setTimeout(() => {
    favicon.badge(4, { bgColor: "#ef4444", textColor: "#ffffff" });
  }, 1400));

  suiteTimers.push(window.setTimeout(() => {
    favicon.status("warning", { warningColor: "#f59e0b" });
  }, 2100));

  suiteTimers.push(window.setTimeout(() => {
    favicon.pulse({ color: "#3b82f6", periodMs: 1000, tickMs: 60 });
    log("Quick suite complete (pulse active)");
  }, 2800));
});

log("Ready. Use any control and inspect this tab favicon.");

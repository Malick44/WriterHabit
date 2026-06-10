import {
  TOP_ALERT_DEDUPE_WINDOW_MS,
  TOP_ALERT_MAX_QUEUE_SIZE,
} from "./topAlert.constants";
import type {
  TopAlertDismissReason,
  TopAlertEntry,
  TopAlertQueueSnapshot,
  TopAlertRequest,
} from "./topAlert.types";

let topAlertIdSequence = 0;

function createTopAlertId(): string {
  topAlertIdSequence += 1;
  return `top-alert-${Date.now()}-${topAlertIdSequence}`;
}

function getDedupeKey(alert: TopAlertRequest): string {
  return alert.dedupeKey ?? [
    alert.type ?? "info",
    alert.titleKey ?? "",
    JSON.stringify(alert.titleParams ?? {}),
    alert.descriptionKey ?? "",
    JSON.stringify(alert.descriptionParams ?? {}),
    alert.actionLabelKey ?? "",
  ].join("|");
}

function toEntry(alert: TopAlertRequest, now: number): TopAlertEntry {
  return {
    ...alert,
    createdAt: now,
    id: alert.id ?? createTopAlertId(),
    type: alert.type ?? "info",
    variant: alert.variant ?? "expanded",
  };
}

export class TopAlertQueue {
  private active: TopAlertEntry | null = null;
  private readonly maxQueueSize: number;
  private readonly recent = new Map<string, number>();
  private queued: TopAlertEntry[] = [];

  constructor(maxQueueSize = TOP_ALERT_MAX_QUEUE_SIZE) {
    this.maxQueueSize = maxQueueSize;
  }

  enqueue(alert: TopAlertRequest, now = Date.now()): TopAlertEntry | null {
    const dedupeWindowMs = alert.dedupeWindowMs ?? TOP_ALERT_DEDUPE_WINDOW_MS;
    const dedupeKey = getDedupeKey(alert);
    const recentTimestamp = this.recent.get(dedupeKey);

    if (recentTimestamp !== undefined && now - recentTimestamp < dedupeWindowMs) {
      return null;
    }

    this.recent.set(dedupeKey, now);
    this.pruneRecent(now);

    const entry = toEntry(alert, now);

    if (!this.active) {
      this.active = entry;
      return entry;
    }

    this.queued = [...this.queued, entry].slice(-this.maxQueueSize);
    return entry;
  }

  dismiss(id?: string): TopAlertEntry | null {
    if (id && this.active?.id !== id) {
      this.queued = this.queued.filter((entry) => entry.id !== id);
      return this.active;
    }

    this.active = this.queued[0] ?? null;
    this.queued = this.queued.slice(1);

    return this.active;
  }

  clear(): void {
    this.active = null;
    this.queued = [];
  }

  snapshot(): TopAlertQueueSnapshot {
    return {
      active: this.active,
      queued: this.queued,
    };
  }

  notifyDismissed(entry: TopAlertEntry | null, reason: TopAlertDismissReason): void {
    entry?.onDismiss?.(reason);
  }

  private pruneRecent(now: number): void {
    for (const [key, timestamp] of this.recent.entries()) {
      if (now - timestamp > TOP_ALERT_DEDUPE_WINDOW_MS * 4) {
        this.recent.delete(key);
      }
    }
  }
}

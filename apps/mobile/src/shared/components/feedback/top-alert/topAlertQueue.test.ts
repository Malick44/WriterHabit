import { TopAlertQueue } from "./topAlertQueue";

describe("TopAlertQueue", () => {
  it("activates the first alert and queues later alerts", () => {
    const queue = new TopAlertQueue();

    const first = queue.enqueue({ titleKey: "alerts.examples.profileSaved.title", type: "success" }, 1000);
    const second = queue.enqueue({ titleKey: "alerts.examples.unsavedChanges.title", type: "warning" }, 1100);

    expect(queue.snapshot().active?.id).toBe(first?.id);
    expect(queue.snapshot().queued.map((entry) => entry.id)).toEqual([second?.id]);

    queue.dismiss(first?.id);

    expect(queue.snapshot().active?.id).toBe(second?.id);
    expect(queue.snapshot().queued).toEqual([]);
  });

  it("deduplicates identical alerts inside the dedupe window", () => {
    const queue = new TopAlertQueue();

    const first = queue.enqueue({ titleKey: "alerts.examples.profileSaved.title", type: "success" }, 1000);
    const duplicate = queue.enqueue({ titleKey: "alerts.examples.profileSaved.title", type: "success" }, 1100);

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
    expect(queue.snapshot().queued).toEqual([]);
  });

  it("allows identical alerts after the dedupe window", () => {
    const queue = new TopAlertQueue();

    const first = queue.enqueue(
      {
        dedupeWindowMs: 200,
        titleKey: "alerts.examples.profileSaved.title",
        type: "success",
      },
      1000,
    );
    const second = queue.enqueue(
      {
        dedupeWindowMs: 200,
        titleKey: "alerts.examples.profileSaved.title",
        type: "success",
      },
      1300,
    );

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(queue.snapshot().queued).toHaveLength(1);
  });

  it("limits queued alerts to the configured size", () => {
    const queue = new TopAlertQueue(2);

    queue.enqueue({ id: "active", titleKey: "alerts.examples.profileSaved.title" }, 1000);
    queue.enqueue({ id: "first", titleKey: "alerts.examples.unsavedChanges.title" }, 1100);
    queue.enqueue({ id: "second", titleKey: "alerts.examples.offline.title" }, 1200);
    queue.enqueue({ id: "third", titleKey: "alerts.examples.syncPending.title" }, 1300);

    expect(queue.snapshot().queued.map((entry) => entry.id)).toEqual(["second", "third"]);
  });
});

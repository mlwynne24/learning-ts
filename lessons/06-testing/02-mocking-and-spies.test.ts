// Companion tests for 02-mocking-and-spies.ts
// Run with: npm run test

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AlertService,
  InMemoryNotifier,
  type Clock,
  type Notifier,
} from "./02-mocking-and-spies.js";

// =============================================================================
// 1. vi.fn() — VERIFY CALLS
// =============================================================================

describe("AlertService with vi.fn()", () => {
  let notifier: Notifier;
  let clock: Clock;

  beforeEach(() => {
    // Fresh mocks per test. Keeps call histories isolated.
    notifier = { send: vi.fn() };
    // A fixed clock — every test sees the same "now".
    clock = { now: () => new Date("2026-04-16T12:00:00.000Z") };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends info alerts to slack", async () => {
    const service = new AlertService(notifier, clock);
    await service.trigger("info", "server started");

    expect(notifier.send).toHaveBeenCalledTimes(1);
    expect(notifier.send).toHaveBeenCalledWith(
      "slack",
      "[2026-04-16T12:00:00.000Z] INFO: server started",
    );
  });

  it("sends error alerts to pager", async () => {
    const service = new AlertService(notifier, clock);
    await service.trigger("error", "db unreachable");

    expect(notifier.send).toHaveBeenCalledWith(
      "pager",
      expect.stringContaining("ERROR: db unreachable"),
    );
    // expect.stringContaining is an "asymmetric matcher" — it lets you assert
    // only the part of the value you care about. Useful when the full value
    // includes a timestamp or other noise.
  });

  it("returns the formatted message", async () => {
    const service = new AlertService(notifier, clock);
    const result = await service.trigger("info", "hello");
    expect(result).toBe("[2026-04-16T12:00:00.000Z] INFO: hello");
  });

  it("propagates errors from the notifier", async () => {
    const broken: Notifier = {
      send: vi.fn().mockRejectedValue(new Error("notifier down")),
    };
    const service = new AlertService(broken, clock);

    // For async rejections, use .rejects before the matcher.
    await expect(service.trigger("info", "hi")).rejects.toThrow("notifier down");
  });
});

// =============================================================================
// 2. USING A FAKE — InMemoryNotifier
// =============================================================================

// Often clearer than a mock — you assert on stored state, not call metadata.

describe("AlertService with a fake notifier", () => {
  it("records every alert it's asked to send", async () => {
    const fake = new InMemoryNotifier();
    const clock: Clock = { now: () => new Date("2026-04-16T12:00:00.000Z") };
    const service = new AlertService(fake, clock);

    await service.trigger("info", "one");
    await service.trigger("error", "two");
    await service.trigger("info", "three");

    expect(fake.sent).toHaveLength(3);
    expect(fake.sent[0]?.channel).toBe("slack");
    expect(fake.sent[1]?.channel).toBe("pager");
    expect(fake.sent[2]?.message).toContain("three");
  });
});

// =============================================================================
// 3. vi.spyOn — OBSERVE A REAL METHOD
// =============================================================================

describe("spyOn", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records calls while keeping original behaviour", () => {
    const obj = {
      double(x: number): number {
        return x * 2;
      },
    };

    const spy = vi.spyOn(obj, "double");

    const result = obj.double(5);

    expect(result).toBe(10); // original still ran
    expect(spy).toHaveBeenCalledWith(5);
    expect(spy).toHaveReturnedWith(10);
  });

  it("can replace the return value with mockReturnValue", () => {
    const obj = {
      double(x: number): number {
        return x * 2;
      },
    };

    vi.spyOn(obj, "double").mockReturnValue(999);

    expect(obj.double(5)).toBe(999); // original bypassed
  });
});

// =============================================================================
// 4. MOCKING GLOBAL fetch
// =============================================================================

// fetch is on the global scope in Node 18+. You can spy on it to simulate
// HTTP responses without hitting a real server.

describe("fetch mocking", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("can stub a successful JSON response", async () => {
    const fakeResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "u1", name: "Morgan" }),
    } as Response;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(fakeResponse);

    const res = await fetch("https://example.com/users/u1");
    const body = (await res.json()) as { id: string; name: string };

    expect(res.status).toBe(200);
    expect(body.name).toBe("Morgan");
    expect(fetch).toHaveBeenCalledWith("https://example.com/users/u1");
  });

  it("can stub a network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ENETUNREACH"));

    await expect(fetch("https://example.com")).rejects.toThrow("ENETUNREACH");
  });
});

// =============================================================================
// 5. mockImplementation — CUSTOM BEHAVIOUR
// =============================================================================

describe("mockImplementation", () => {
  it("lets you write arbitrary logic inside a mock", () => {
    const store = new Map<string, string>();

    const get = vi.fn<(key: string) => string | undefined>().mockImplementation((key) =>
      store.get(key),
    );
    const set = vi.fn<(key: string, value: string) => void>().mockImplementation((key, value) => {
      store.set(key, value);
    });

    set("name", "Morgan");
    expect(get("name")).toBe("Morgan");
    expect(set).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("name");
  });

  it("can change behaviour over sequential calls", () => {
    const fn = vi
      .fn<() => string>()
      .mockReturnValueOnce("first")
      .mockReturnValueOnce("second")
      .mockReturnValue("default");

    expect(fn()).toBe("first");
    expect(fn()).toBe("second");
    expect(fn()).toBe("default");
    expect(fn()).toBe("default"); // stays on default
  });
});

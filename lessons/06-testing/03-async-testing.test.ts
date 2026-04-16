// Companion tests for 03-async-testing.ts
// Run with: npm run test

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchUser, retry, debounce } from "./03-async-testing.js";

// =============================================================================
// 1. BASIC ASYNC ASSERTIONS
// =============================================================================

describe("fetchUser", () => {
  it("resolves with a user object", async () => {
    const user = await fetchUser("u1");
    expect(user).toEqual({ id: "u1", name: "User u1" });
  });

  it("uses .resolves for a cleaner style", async () => {
    await expect(fetchUser("u2")).resolves.toEqual({ id: "u2", name: "User u2" });
  });

  it("rejects for a missing user", async () => {
    await expect(fetchUser("missing")).rejects.toThrow("user not found: missing");
  });

  it("asserting on the Error instance", async () => {
    await expect(fetchUser("missing")).rejects.toBeInstanceOf(Error);
  });
});

// =============================================================================
// 2. FAKE TIMERS FOR debounce
// =============================================================================

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only invokes the wrapped fn once for a burst of calls", () => {
    const spy = vi.fn<(msg: string) => void>();
    const debounced = debounce(spy, 100);

    debounced("a");
    debounced("b");
    debounced("c");

    // Before the delay elapses, the wrapped fn has NOT fired.
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    // After 100ms, it fires once — with the LAST arguments.
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("c");
  });

  it("resets the timer when called again before firing", () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    vi.advanceTimersByTime(80); // not yet
    debounced(); // resets — another 100ms to go
    vi.advanceTimersByTime(80); // total 160ms since first call, but only 80ms since second
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20); // now 100ms since the second call
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// 3. FAKE TIMERS FOR retry (the ASYNC dance)
// =============================================================================

describe("retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the value on the first attempt when the op succeeds", async () => {
    const op = vi.fn<() => Promise<string>>().mockResolvedValue("ok");

    const result = await retry(op, 3, 100);
    expect(result).toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and eventually succeeds", async () => {
    const op = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("ok");

    // Kick off the retry — DON'T await yet. We need to advance timers first.
    const promise = retry(op, 3, 100);

    // Drain microtasks + the first backoff (100ms).
    await vi.advanceTimersByTimeAsync(100);
    // Drain the second backoff (200ms).
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe("ok");
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("gives up after `attempts` failures", async () => {
    const op = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("always fails"));

    const promise = retry(op, 3, 100);
    // We expect to reject — attach the assertion now so we definitely catch it.
    const assertion = expect(promise).rejects.toThrow("retry: all attempts failed");

    // Advance past every backoff (100ms + 200ms).
    await vi.advanceTimersByTimeAsync(300);
    await assertion;

    expect(op).toHaveBeenCalledTimes(3);
  });
});

// =============================================================================
// 4. DETERMINISTIC Date.now()
// =============================================================================

describe("setSystemTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pins Date.now()", () => {
    expect(Date.now()).toBe(new Date("2026-04-16T12:00:00.000Z").getTime());
    expect(new Date().toISOString()).toBe("2026-04-16T12:00:00.000Z");
  });

  it("advances when timers advance", () => {
    vi.advanceTimersByTime(1000);
    expect(new Date().toISOString()).toBe("2026-04-16T12:00:01.000Z");
  });
});

// =============================================================================
// 5. STUBBING Math.random
// =============================================================================

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

describe("Math.random stubbing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("makes a random-based function deterministic", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const id1 = randomId();
    const id2 = randomId();
    expect(id1).toBe(id2); // same Math.random → same id
  });

  it("restoreAllMocks brings back real randomness", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.restoreAllMocks();
    // Now Math.random is the real thing — can't assert an exact value,
    // but we can assert we get DIFFERENT ids across calls.
    expect(randomId()).not.toBe(randomId());
  });
});

// =============================================================================
// 6. STUBBING ENV VARS
// =============================================================================

function shouldLogDebug(): boolean {
  return process.env.NODE_ENV !== "production";
}

describe("stubEnv", () => {
  // stubEnv is automatically unstubbed after each test when using the default
  // unstubEnvs config — safe by default in our setup.

  it("logs debug in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(shouldLogDebug()).toBe(true);
  });

  it("does not log debug in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(shouldLogDebug()).toBe(false);
  });
});

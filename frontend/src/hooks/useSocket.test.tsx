import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSocket } from "./useSocket";

const authState = vi.hoisted(() => ({
  getToken: vi.fn(async () => null),
  isLoaded: true,
  isSignedIn: true,
}));

const socketHarness = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;

  const socketHandlers = new Map<string, Set<Handler>>();
  const managerHandlers = new Map<string, Set<Handler>>();

  function addHandler(
    handlers: Map<string, Set<Handler>>,
    event: string,
    handler: Handler,
  ) {
    const eventHandlers = handlers.get(event) ?? new Set<Handler>();
    eventHandlers.add(handler);
    handlers.set(event, eventHandlers);
  }

  function removeHandler(
    handlers: Map<string, Set<Handler>>,
    event: string,
    handler: Handler,
  ) {
    const eventHandlers = handlers.get(event);
    eventHandlers?.delete(handler);
    if (eventHandlers?.size === 0) handlers.delete(event);
  }

  const manager = {
    on: vi.fn((event: string, handler: Handler) => {
      addHandler(managerHandlers, event, handler);
      return manager;
    }),
    off: vi.fn((event: string, handler: Handler) => {
      removeHandler(managerHandlers, event, handler);
      return manager;
    }),
  };

  const socket = {
    connected: false,
    active: false,
    on: vi.fn((event: string, handler: Handler) => {
      addHandler(socketHandlers, event, handler);
      return socket;
    }),
    off: vi.fn((event: string, handler: Handler) => {
      removeHandler(socketHandlers, event, handler);
      return socket;
    }),
    connect: vi.fn(() => {
      socket.active = true;
      return socket;
    }),
    io: manager,
  };

  function emit(
    handlers: Map<string, Set<Handler>>,
    event: string,
    ...args: unknown[]
  ) {
    handlers.get(event)?.forEach((handler) => handler(...args));
  }

  return {
    socket,
    socketHandlers,
    managerHandlers,
    emitSocket: (event: string, ...args: unknown[]) =>
      emit(socketHandlers, event, ...args),
    emitManager: (event: string, ...args: unknown[]) =>
      emit(managerHandlers, event, ...args),
    reset() {
      socket.connected = false;
      socket.active = false;
      socketHandlers.clear();
      managerHandlers.clear();
      socket.on.mockClear();
      socket.off.mockClear();
      socket.connect.mockClear();
      manager.on.mockClear();
      manager.off.mockClear();
    },
  };
});

vi.mock("@clerk/react", () => ({
  useAuth: () => authState,
}));

vi.mock("../lib/socket", () => ({
  createSocket: () => socketHarness.socket,
}));

type ReactiveSocketResult = ReturnType<typeof useSocket> & {
  active: boolean;
  ready: boolean;
  connect: () => void;
};

describe("useSocket", () => {
  beforeEach(() => {
    socketHarness.reset();
    authState.isLoaded = true;
    authState.isSignedIn = true;
  });

  it("hydrates without publishing an incomplete socket snapshot", async () => {
    socketHarness.socket.connected = true;
    socketHarness.socket.active = true;

    const { result } = renderHook(() => useSocket());

    expect((result.current as ReactiveSocketResult).ready).toBe(false);

    await act(async () => {
      await Promise.resolve();
    });

    expect((result.current as ReactiveSocketResult).ready).toBe(true);
    expect(result.current.connected).toBe(true);
    expect((result.current as ReactiveSocketResult).active).toBe(true);
  });

  it("reacts to automatic failure and manual retry and cleans up subscriptions", async () => {
    socketHarness.socket.connected = true;
    socketHarness.socket.active = true;

    const { result, unmount } = renderHook(() => useSocket());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      socketHarness.socket.connected = false;
      socketHarness.socket.active = true;
      socketHarness.emitSocket("disconnect", "transport close");
    });

    expect(result.current.connected).toBe(false);
    expect((result.current as ReactiveSocketResult).active).toBe(true);

    act(() => {
      socketHarness.socket.connected = true;
      socketHarness.emitSocket("connect");
    });

    expect(result.current.connected).toBe(true);

    act(() => {
      socketHarness.socket.connected = false;
      socketHarness.socket.active = true;
      socketHarness.emitSocket("disconnect", "transport close");
    });

    act(() => {
      socketHarness.emitManager("reconnect_failed");
    });

    expect((result.current as ReactiveSocketResult).active).toBe(false);

    act(() => {
      (result.current as ReactiveSocketResult).connect();
    });

    expect((result.current as ReactiveSocketResult).active).toBe(true);

    act(() => {
      socketHarness.socket.connected = true;
      socketHarness.emitSocket("connect");
    });

    expect(result.current.connected).toBe(true);

    unmount();
    expect(socketHarness.socketHandlers.size).toBe(0);
    expect(socketHarness.managerHandlers.size).toBe(0);
  });
});

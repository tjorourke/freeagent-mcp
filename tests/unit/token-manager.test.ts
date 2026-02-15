import { describe, it, expect, vi } from 'vitest';

// Mock oauth.js to avoid config validation at import time
vi.mock('../../src/auth/oauth.js', () => ({
  refreshAccessToken: vi.fn(),
}));

import { createTokenManager } from '../../src/auth/token-manager.js';
import type { TokenStore } from '../../src/auth/token-store.js';

function createMockStore(): TokenStore {
  let tokens: any = null;
  return {
    get: () => tokens,
    set: (t: any) => { tokens = t; },
    clear: () => { tokens = null; },
    persist: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(undefined),
  };
}

describe('TokenManager.invalidateAccessToken', () => {
  it('marks access token as expired so next getAccessToken triggers refresh', () => {
    const store = createMockStore();
    const futureExpiry = Date.now() + 3600 * 1000;
    store.set({
      accessToken: 'stale-token',
      refreshToken: 'refresh-token',
      expiresAt: futureExpiry,
      refreshTokenExpiresAt: Date.now() + 14 * 24 * 3600 * 1000,
    });

    const manager = createTokenManager(store);

    // Before invalidation, token appears valid
    expect(store.get()!.expiresAt).toBe(futureExpiry);

    manager.invalidateAccessToken();

    // After invalidation, expiresAt is 0 which will trigger refresh
    expect(store.get()!.expiresAt).toBe(0);
  });

  it('is a no-op when no tokens are stored', () => {
    const store = createMockStore();
    const manager = createTokenManager(store);

    // Should not throw
    manager.invalidateAccessToken();
    expect(store.get()).toBeNull();
  });

  it('does not affect refresh token expiry', () => {
    const store = createMockStore();
    const refreshExpiry = Date.now() + 14 * 24 * 3600 * 1000;
    store.set({
      accessToken: 'stale-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600 * 1000,
      refreshTokenExpiresAt: refreshExpiry,
    });

    const manager = createTokenManager(store);
    manager.invalidateAccessToken();

    expect(store.get()!.refreshTokenExpiresAt).toBe(refreshExpiry);
    expect(store.get()!.expiresAt).toBe(0);
  });
});

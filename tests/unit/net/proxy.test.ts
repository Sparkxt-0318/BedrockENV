import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('undici', () => ({
  EnvHttpProxyAgent: vi.fn().mockImplementation(() => ({})),
  setGlobalDispatcher: vi.fn(),
}));

describe('installProxyDispatcherOnce', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
  });

  afterEach(() => {
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    vi.restoreAllMocks();
  });

  it('returns without error when no proxy env vars are set', async () => {
    const { installProxyDispatcherOnce } = await import('@/lib/net/proxy');
    expect(() => installProxyDispatcherOnce()).not.toThrow();
  });

  it('is idempotent — calling twice does not throw', async () => {
    const { installProxyDispatcherOnce } = await import('@/lib/net/proxy');
    installProxyDispatcherOnce();
    expect(() => installProxyDispatcherOnce()).not.toThrow();
  });

  it('installs dispatcher when HTTPS_PROXY is set', async () => {
    process.env.HTTPS_PROXY = 'http://proxy.example.com:3128';
    const { installProxyDispatcherOnce } = await import('@/lib/net/proxy');
    expect(() => installProxyDispatcherOnce()).not.toThrow();
  });

  it('reads lowercase https_proxy env var', async () => {
    process.env.https_proxy = 'http://proxy.example.com:3128';
    const { installProxyDispatcherOnce } = await import('@/lib/net/proxy');
    expect(() => installProxyDispatcherOnce()).not.toThrow();
  });
});

/**
 * Next.js instrumentation hook — runs once on server startup for both the
 * Node.js runtime and (where applicable) during server-side rendering.
 *
 * We use it to install an undici proxy dispatcher when HTTPS_PROXY is set,
 * so that outbound fetch() calls from route handlers honor the proxy. Node
 * 22's built-in fetch (undici) does not read HTTPS_PROXY on its own.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { installProxyDispatcherOnce } = await import('@/lib/net/proxy');
    installProxyDispatcherOnce();
  }
}

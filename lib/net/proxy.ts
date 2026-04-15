/**
 * Proxy bootstrap — wires Node's built-in fetch (undici) to an HTTPS_PROXY
 * when one is present in the environment.
 *
 * Node 22's undici does NOT read HTTPS_PROXY / HTTP_PROXY / NO_PROXY on its
 * own — you have to install a dispatcher. curl honors those vars natively,
 * which is why `curl` works from a shell but `fetch()` from Node times out
 * in corporate-proxy / sandboxed environments.
 *
 * This module installs `EnvHttpProxyAgent` (which honors all three env vars)
 * exactly once per process. It's safe to import from multiple entry points.
 */

let installed = false;

export function installProxyDispatcherOnce(): void {
  if (installed) return;
  installed = true;

  const httpsProxy =
    process.env.HTTPS_PROXY ??
    process.env.https_proxy ??
    process.env.HTTP_PROXY ??
    process.env.http_proxy;

  if (!httpsProxy) return;

  // Lazy-require undici so non-proxied environments don't pay the cost.
  // undici is a devDependency because Node ships its own copy; we only
  // reach for the package when we need the ProxyAgent classes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const undici = require('undici') as typeof import('undici');
  const { EnvHttpProxyAgent, setGlobalDispatcher } = undici;
  setGlobalDispatcher(new EnvHttpProxyAgent());
}

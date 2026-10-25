import { KitError } from './index';
/** Next may normalize request.url to localhost; validate the actual Host too, without trusting forwarding headers. */
export function demoOrigin(request: Request) {
  const url = new URL(request.url);
  let host: URL;
  try {
    host = new URL(`${url.protocol}//${request.headers.get('host') ?? url.host}`);
  } catch {
    throw new KitError('DEMO_ONLY', 'Invalid local host', 403);
  }
  const allowed = ['localhost', '127.0.0.1', '[::1]'];
  if (
    !allowed.includes(url.hostname) ||
    !allowed.includes(host.hostname) ||
    host.username ||
    host.password ||
    host.pathname !== '/' ||
    host.search ||
    host.hash
  )
    throw new KitError('DEMO_ONLY', 'This memory demo requires a loopback host', 403);
  return host.origin;
}
export function authorizeDemoReset(request: Request) {
  if (
    request.headers.get('origin') !== demoOrigin(request) ||
    request.headers.get('x-kit-demo-reset') !== 'confirm'
  )
    throw new KitError('RESET_DENIED', 'Explicit same-origin loopback demo reset required', 403);
}

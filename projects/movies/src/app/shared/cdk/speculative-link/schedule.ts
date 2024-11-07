import { setTimeout as unpatchedSetTimeout } from '@rx-angular/cdk/zone-less/browser';

const hasIdleCallback = 'window' in globalThis && typeof window.requestIdleCallback === 'function';

const schedule = !hasIdleCallback
  ? (cb: () => void, options?: IdleRequestOptions) => unpatchedSetTimeout(cb, options?.timeout ?? 0)
  : window.requestIdleCallback;

export default schedule;

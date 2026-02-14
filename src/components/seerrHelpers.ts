import { SeerrResult } from '../api/seerr';

export function resolveSeerrImage(
  base?: string | null,
  path?: string | null,
  type: 'poster' | 'backdrop' = 'poster'
) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const b = base?.replace(/\/$/, '');
  if (!b) return null;

  const clean = path.replace(/^\//, '');
  if (clean.includes('imageproxy')) {
    return `${b}/${clean}`;
  }

  const proxyPrefix =
    type === 'backdrop'
      ? '/imageproxy/tmdb/t/p/w1920_and_h800_multi_faces/'
      : '/imageproxy/tmdb/t/p/w300_and_h450_face/';
  return `${b}${proxyPrefix}${clean}`;
}

export function getDisplayName(item: SeerrResult): string {
  return item.title || item.originalTitle || 'Untitled';
}

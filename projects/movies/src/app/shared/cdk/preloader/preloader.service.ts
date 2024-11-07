export function preloadImage(path: string) {
  const link = window.document.createElement('link');
  link.rel = 'preload';
  link.href = `https://image.tmdb.org/t/p/w342${path}`;
  link.as = 'image';
  window.document.head.appendChild(link);
}

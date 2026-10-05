const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

export function redirectDocument(destination: string, origin: URL | undefined): string {
  if (!origin || !/^\/[a-z0-9/-]*$/.test(destination))
    throw new Error('Invalid static redirect destination');
  const canonical = new URL(destination, origin).href;
  return `<!doctype html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Weiterleitung</title><link rel="canonical" href="${escape(canonical)}"><meta http-equiv="refresh" content="0;url=${escape(destination)}"><script>window.location.replace(${JSON.stringify(destination)} + window.location.search + window.location.hash);</script></head><body><a href="${escape(destination)}">Weiter zur Seite</a></body></html>`;
}

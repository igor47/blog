import { useEffect, useRef, useState } from 'react';

export default function GistEmbed({ url }: { url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  const jsUrl = url.endsWith('.js') ? url : `${url}.js`;
  const srcDoc = `<!doctype html><html><head><base target="_parent"></head><body style="margin:0"><script src="${jsUrl}"></script></body></html>`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const measure = () => {
      const doc = iframe.contentDocument;
      if (doc?.body) setHeight(doc.body.scrollHeight);
    };

    iframe.addEventListener('load', measure);
    const interval = setInterval(measure, 500);
    const stopPolling = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      iframe.removeEventListener('load', measure);
      clearInterval(interval);
      clearTimeout(stopPolling);
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      title="Embedded gist"
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: `${height}px`, border: 'none' }}
    />
  );
}

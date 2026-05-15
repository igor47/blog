export const GIST_MARKER_RE = /<!--\s*GIST_EMBED:(\S+?)(?:\s+height=(\d+))?\s*-->/g;

function gistIdFromUrl(url: string): string | null {
  const match = url.match(/gist\.github\.com\/[^/]+\/([a-f0-9]+)/);
  return match ? match[1] : null;
}

interface GistFile {
  filename?: string;
  language?: string | null;
  content?: string;
}

interface GistResponse {
  files?: Record<string, GistFile>;
}

export async function gistContentMarkdown(url: string): Promise<string> {
  const id = gistIdFromUrl(url);
  const fallback = `\n\n[View gist on GitHub](${url})\n\n`;
  if (!id) return fallback;

  try {
    const res = await fetch(`https://api.github.com/gists/${id}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return fallback;

    const data = (await res.json()) as GistResponse;
    const files = Object.entries(data.files ?? {});
    if (files.length === 0) return fallback;

    const blocks = files.map(([name, file]) => {
      const lang = (file.language ?? '').toLowerCase();
      const content = file.content ?? '';
      return `**${name}**\n\n\`\`\`${lang}\n${content}\n\`\`\``;
    });

    return `\n\n${blocks.join('\n\n')}\n\n[View gist on GitHub](${url})\n\n`;
  } catch {
    return fallback;
  }
}

export default function GistEmbed({ url, height = 400 }: { url: string; height?: number }) {
  const jsUrl = url.endsWith('.js') ? url : `${url}.js`;
  const srcDoc = `<!doctype html><html><head><base target="_parent"></head><body style="margin:0"><script src="${jsUrl}"></script></body></html>`;

  return (
    <iframe
      srcDoc={srcDoc}
      title="Embedded gist"
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: `${height}px`, border: 'none' }}
    />
  );
}

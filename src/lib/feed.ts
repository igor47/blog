import { writeFileSync } from 'node:fs'
import { Feed } from 'feed'

import type { Post } from './posts'
import { makePostBody } from './posts'
import { GIST_MARKER_RE, gistContentMarkdown } from '../components/GistEmbed'

// Process content for feed: convert <!-- FEED: message --> comments to visible text,
// and substitute <!-- GIST_EMBED:URL --> markers with the gist's current content.
async function processFeedContent(content: string): Promise<string> {
  let result = content.replace(/<!--\s*FEED:\s*(.*?)\s*-->/g, '$1')

  const matches = Array.from(result.matchAll(GIST_MARKER_RE))
  for (const match of matches) {
    const replacement = await gistContentMarkdown(match[1])
    result = result.replace(match[0], replacement)
  }

  return result
}

async function generateFeed(posts: Post[]) {
  const feed = new Feed({
    title: "Igor47's Blog",
    description: "The feed for Igor's personal writing",
    id: "https://igor.moomers.org/",
    link: "https://igor.moomers.org/",
    language: "en",
    image: "https://igor.moomers.org/images/myhead.jpg",
    favicon: "https://igor.moomers.org/favicon.ico",
    copyright: `All rights reserved ${new Date().getFullYear()}, Igor Serebryany`,
    generator: "NextJs + Feed",
    feedLinks: {
      rss2: "https://igor.moomers.org/feed.xml",
      json: "https://igor.moomers.org/feed.json",
      atom: "https://igor.moomers.org/feed.atom"
    },
    author: {
      name: "Igor Serebryany",
      link: "https://igor.moomers.org/"
    }
  });

  const base = "https://igor.moomers.org/"

  for (const post of posts) {
    if (post.draft) continue;

    feed.addItem({
      title: post.title,
      id: (new URL(`/posts/${post.slug}`, base)).toString(),
      link: (new URL(`/posts/${post.slug}`, base)).toString(),
      description: post.description ?? undefined,
      date: post.date,
      image: post.image && (new URL(post.image, base)).toString() || undefined,
      content: String(await makePostBody({ ...post, content: await processFeedContent(post.content) })),
    });
  }

  feed.addCategory("Technology");
  feed.addCategory("Philosophy");
  feed.addCategory("Humanity");

  writeFileSync('./public/feed.xml', feed.rss2());
  writeFileSync('./public/feed.atom', feed.atom1());
  writeFileSync('./public/feed.json', feed.json1());
}

export { generateFeed };

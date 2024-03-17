import { writeFileSync } from 'node:fs'
import { Feed } from 'feed'

import type { Post } from './posts'

function generateFeed(posts: Post[]) {
  const feed = new Feed({
    title: "Igor47's Blog",
    description: "The feed for Igor's personal writing",
    id: "https://igor.moomers.org/",
    link: "https://igor.moomers.org/",
    language: "en",
    image: "https://igor.moomers.org/images/myhead.jpg",
    favicon: "https://igor.moomers.org/favicon.ico",
    copyright: "All rights reserved 2023, Igor Serebryany",
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

  posts.forEach(post => {
    if (post.draft) return;

    feed.addItem({
      title: post.title,
      id: (new URL(`/posts/${post.slug}`, base)).toString(),
      link: (new URL(`/posts/${post.slug}`, base)).toString(),
      description: post.description ?? undefined,
      date: post.date,
      image: post.image && (new URL(post.image, base)).toString() || undefined,
      content: post.content,
    });
  });

  feed.addCategory("Technology");
  feed.addCategory("Philosophy");
  feed.addCategory("Humanity");

  writeFileSync('./public/feed.xml', feed.rss2());
  writeFileSync('./public/feed.atom', feed.atom1());
  writeFileSync('./public/feed.json', feed.json1());
}

export { generateFeed };

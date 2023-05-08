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

  posts.forEach(post => {
    feed.addItem({
      title: post.title,
      id: `https://igor.moomers.org/posts/${post.slug}`,
      link: `https://igor.moomers.org/posts/${post.slug}`,
      date: post.date,
      //image: post.image ?? undefined,
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

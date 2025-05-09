import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

import rehypeRaw from 'rehype-raw'
import rehypePrism from '@mapbox/rehype-prism'
import rehypeFormat from 'rehype-format'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

import { bootstrapize } from './bootstrap'

const POSTS_DIR = join(process.cwd(), 'posts')
export type Post = {
  id: string,
  fullPath: string,
  date: Date,
  slug: string,
  title: string,
  content: string,
  draft: boolean,
  description: string | null,
  image: string | null,
  isNowPage: boolean,
}

export function getPosts(postsDir = POSTS_DIR) {
  // Get file names under /posts
  const fileNames = readdirSync(postsDir);
  const posts: Array<Post> = []

  for (const fileName of fileNames) {
    const skipReasons: string[] = [];

    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '');

    // extract the date from the file name
    const dateStr = id.slice(0, 10);
    let date: Date | null = new Date(dateStr);
    if (isNaN(date.getTime())) date = null;

    // slug is just the text without the date
    let slug = date ? id.slice(11) : id;

    // Use gray-matter to parse the post
    const fullPath = join(postsDir, fileName);
    const matterResult = matter.read(fullPath);

    if (!matterResult.data.title) skipReasons.push('missing title');
    if (matterResult.data.slug) slug = matterResult.data.slug;

    // date could just be in the post front matter
    if (!date) {
      const dateStr = matterResult.data.date;
      date = dateStr ? new Date(dateStr) : null;
    }
    if (!date) skipReasons.push('missing date');

    if (skipReasons.length > 0) {
      console.log(`Skipping ${fullPath} (${skipReasons.join(', ')})`);
      continue;
    }

    // Combine the data with the id
    posts.push({
      id,
      fullPath,
      date: date as Date,
      slug: matterResult.data.slug || slug,
      title: matterResult.data.title,
      description: matterResult.data.description || null,
      image: matterResult.data.image || null,
      content: matterResult.content,
      draft: matterResult.data.draft || false,
      isNowPage: !!matterResult.data.isNowPage,
    });
  }

  return posts.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export async function makePostBody(post: Post) {
  return unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    // raw html support
    .use(rehypeRaw)
    .use(rehypePrism, { ignoreMissing: true })
    .use(rehypeFormat)
    .use(rehypeSlug)
    .use(bootstrapize)
    .use(rehypeStringify)
    .process(post.content)
}

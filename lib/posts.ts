import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = join(process.cwd(), 'posts')
type Post = {
  id: string,
  fullPath: string,
  date: Date,
  slug: string,
  title: string,
  content: string,
  description: string | null,
}

function getPosts(postsDir = POSTS_DIR) {
  // Get file names under /posts
  const fileNames = readdirSync(postsDir);
  const posts: Array<Post> = []

  for (const fileName of fileNames) {
    let skipReasons: String[] = [];

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
    if (matterResult.data.draft) skipReasons.push('is draft');
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
      content: matterResult.content,
    });
  }

  return posts.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export {
  getPosts,
}

export type {
  Post,
}

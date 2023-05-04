import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = join(process.cwd(), '_posts')
type Post = {
  id: string,
  fullPath: string,
  date: Date,
  title: string,
  content: string,
}

function getSortedPosts(postsDir = POSTS_DIR) {
  // Get file names under /posts
  const fileNames = readdirSync(postsDir);
  const posts: Array<Post> = []

  for (const fileName of fileNames) {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '');

    // extract the date from the file name
    const dateStr = id.slice(0, 10);
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;

    // Use gray-matter to parse the post
    const fullPath = join(postsDir, fileName);
    const matterResult = matter.read(fullPath);

    if (!matterResult.data.title) continue;
    if (matterResult.data.draft) continue;


    // Combine the data with the id
    posts.push({
      id,
      fullPath,
      date,
      title: matterResult.data.title,
      content: matterResult.content,
    });
  }

  return posts.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export {
  getSortedPosts,
}

export type {
  Post,
}

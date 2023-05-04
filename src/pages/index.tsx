import Head from 'next/head'

import dayjs from 'dayjs'

import { getSortedPosts } from '../../lib/posts'
import type { Post } from '../../lib/posts'

export default function Home({ posts }: { posts: Array<Post> }) {
  return (<>
    <Head>
      <title>Igor47 - Home</title>
    </Head>

    <main>
      <h3>My Posts</h3>
      <small>See the feed: </small>

      <div className="pt-3">

      { posts.map(post => (
          <div className="d-flex flex-row flex-justify-content-between flex-wrap-reverse" key={post.id}>
            <div className="flex-grow-1">
              {post.title}
            </div>

            <div className="px-2 text-secondary">
              {dayjs(post.date).format('MMM YYYY')}
            </div>
          </div>
      )) }

      </div>
    </main>
  </>)
}

export async function getStaticProps() {
  const posts = getSortedPosts()

  return {
    props: {
      posts: posts.map(post => ({
        ...post,
        date: post.date.toISOString(),
      }))
    }
  }
}

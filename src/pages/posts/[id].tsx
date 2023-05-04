import Head from 'next/head'

import dayjs from 'dayjs'

import { getPosts } from '../../../lib/posts'
import type { Post } from '../../../lib/posts'

export default function Post({ post }: { post: Post }) {
  const title = `Igor47 - ${ post.title }`

  return (<>
    <Head>
      <title>{title}</title>
    </Head>

    <main>
      <h3>{ post.title }</h3>
      <small>{dayjs(post.date).format('MMM YYYY')}</small>

      <div className="pt-3">
        content
      </div>
    </main>
  </>)
}

export async function getStaticPaths() {
  const posts = getPosts()

  return {
    paths: posts.map(post => ({
      params: {
        id: post.id,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const posts = getPosts()
  const post = posts.find(p => p.id === params.id)

  return {
    props: {
      post: {
        ...post,
        date: post.date.toISOString(),
      },
    }
  }
}


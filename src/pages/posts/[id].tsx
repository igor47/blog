import Head from 'next/head'

import { remark } from 'remark';
import html from 'remark-html';
import prism from 'remark-prism';

import dayjs from 'dayjs'

import { getPosts } from '../../../lib/posts'
import type { Post } from '../../../lib/posts'

export default function Post({ post, body }: { post: Post, body: string }) {
  const title = `Igor47 - ${ post.title }`

  return (<>
    <Head>
      <title>{title}</title>
    </Head>

    <main>
      <h3>{ post.title }</h3>
      <small>{dayjs(post.date).format('MMM YYYY')}</small>

      <div className="pt-3" dangerouslySetInnerHTML={{ __html: body }}>
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
  const post = posts.find(p => p.id === params.id)!
  const body = await (remark()
    .use(prism)
    .use(html, { sanitize: false })
    .process(post.content))

  return {
    props: {
      post: {
        ...post,
        date: post.date.toISOString(),
      },
      body: body.toString(),
    }
  }
}

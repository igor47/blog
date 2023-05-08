import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

import dayjs from 'dayjs'

import { generateFeed } from '../../lib/feed'
import { getPosts } from '../../lib/posts'
import type { Post } from '../../lib/posts'

import atom from '../icons/atom.svg'
import json from '../icons/json.svg'
import rss from '../icons/rss.svg'

export default function Home({ posts }: { posts: Array<Post> }) {
  return (<>
    <Head>
      <title>Igor47 - Home</title>
    </Head>

    <main>
      <h3>
        All Posts -

        <a href="/feed.atom" target="_blank">
          <Image src={atom} alt="Atom feed" width={18} height={18} className="link-secondary mx-2" />
        </a>

        <a href="/feed.json" target="_blank">
          <Image src={json} alt="JSON feed" width={18} height={18} className="link-secondary mx-2" />
        </a>

        <a href="/feed.xml" target="_blank">
          <Image src={rss} alt="RSS feed" width={18} height={18} className="link-secondary mx-2" />
        </a>
      </h3>

      <div className="pt-3">

      { posts.map(post => (
          <div className="d-flex flex-row flex-justify-content-between flex-wrap-reverse" key={post.slug}>
            <div className="flex-grow-1">
              <small className="text-secondary text-danger">
                {post.draft ? 'draft' : null}
              </small>
              <Link href={`/posts/${post.slug}`}>
                {post.title}
              </Link>
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
  const posts = getPosts()

  // generate rss feeds
  generateFeed(posts)


  return {
    props: {
      posts: posts.map(post => ({
        ...post,
        date: post.date.toISOString(),
      }))
    }
  }
}

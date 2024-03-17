import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

import dayjs from 'dayjs'

import { generateFeed } from '../lib/feed'
import { getPosts } from '../lib/posts'
import type { Post } from '../lib/posts'

import atom from '../icons/atom.svg'
import json from '../icons/json.svg'
import rss from '../icons/rss.svg'

export default function Home({ posts }: { posts: Array<Post> }) {
  return (<>
    <Head>
      <title>Igor47 - Home</title>
      <meta property="og:url" content="https://igor.moomers.org/" key="url" />
    </Head>

    <main>
      <div className="d-flex flex-row">
        <h3 className="align-self-end me-auto">
          All Posts
        </h3>

        <small className="d-flex flex-row align-items-center">
          <div>
            Feeds:
          </div>

          <a href="/feed.atom" target="_blank" className="d-flex flex-column ms-2 link-secondary align-items-center">
            <Image src={atom} alt="Atom feed" width={18} height={18} />
            Atom
          </a>

          <a href="/feed.json" target="_blank" className="d-flex flex-column ms-2 link-secondary align-items-center">
            <Image src={json} alt="JSON feed" width={18} height={18} />
            JSON
          </a>

          <a href="/feed.xml" target="_blank" className="d-flex flex-column ms-2 link-secondary align-items-center">
            <Image src={rss} alt="RSS feed" width={18} height={18} />
            RSS2
          </a>
        </small>
      </div>

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
  let posts = getPosts()

  // generate rss feeds
  generateFeed(posts)

  // treat the latest now page specially
  const nows = posts.filter(post => post.isNowPage)
  nows.sort((a, b) => a.date.getTime() - b.date.getTime())
  const now = nows[0]

  // exclude now page
  posts = posts.filter(post => post.slug !== now.slug)

  // potentially exclude drafts
  if (process.env.NODE_ENV !== 'development') {
    posts = posts.filter(post => !post.draft)
  }

  return {
    props: {
      posts: posts.map(post => ({
        ...post,
        date: post.date.toISOString(),
      })),
      now: now.slug,
    }
  }
}

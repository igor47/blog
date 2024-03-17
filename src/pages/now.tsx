import Head from 'next/head'
import Link from 'next/link'

import { getPosts, makePostBody } from '@/lib/posts'
import type { Post } from '@/lib/posts'
import dayjs from 'dayjs'

export default function Now({ post, body }: { post: Post, body: string }) {
  const date = dayjs(post.date)
  let titleClass = 'mb-3'
  let titleImage = null
  let ogImage = null
  if (post.image) {
    titleClass = 'col-6 col-lg-5 d-flex flex-column justify-content-center'
    titleImage = (
      <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
        <img
          src={ post.image }
          alt="A picture that describes this post"
          className="rounded"
          style={{
            width: '100%',
            height: '10rem',
            objectFit: 'cover',
          }}
        />
      </div>
    )
    ogImage = <meta property="og:image" content={ post.image } key="image" />
  }

  return (<>
    <Head>
      <title>Igor47 - Now</title>

      <meta property="og:title" content="Igor's Now Page" key="title" />
      <meta name="description" content="Igor Serebryany -- Now" key="description" />
      <meta property="og:url" content="https://igor.moomers.org/now" key="url" />
    </Head>

    <main>
      <div className="row mb-3">
        { titleImage }

        <div className={titleClass}>
          <h3>
            { post.title }
            <sup className="text-secondary text-danger">
              {post.draft ? 'draft' : null}
            </sup>
          </h3>
        </div>
      </div>

      <div className="pt-3" dangerouslySetInnerHTML={{ __html: body }}>
      </div>

      <small>
        See more now pages <a href="https://nownownow.com/">
          here
        </a> or <a href="https://nownownow.com/about">
          learn more
        </a> .
      </small>
    </main>
  </>)
}

export async function getStaticProps() {
  const posts = getPosts()
  let nows = posts.filter(post => post.isNowPage)
  nows.sort((a, b) => a.date.getTime() - b.date.getTime())

  // potentially exclude drafts
  if (process.env.NODE_ENV !== 'development') {
    nows = nows.filter(post => !post.draft)
  }

  const now = nows[0]
  const body = await makePostBody(now)

  return {
    props: {
      post: {
        ...now,
        date: now.date.toISOString(),
      },
      body: body.toString(),
    }
  }
}

import Head from 'next/head'

import rehypeRaw from 'rehype-raw'
import rehypePrism from '@mapbox/rehype-prism'
import rehypeFormat from 'rehype-format'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

import dayjs from 'dayjs'

import { bootstrapize } from '../../lib/bootstrap'
import { getPosts } from '../../lib/posts'
import type { Post } from '../../lib/posts'

export default function Post({ post, body }: { post: Post, body: string }) {
  const title = `Igor47 - ${ post.title }`
  const date = dayjs(post.date)

  const description = post.description ?
    <meta name="description" content={ post.description } key="description" /> : null

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
      <title>{title}</title>
      <meta property="og:title" content={ post.title } key="title" />

      <meta property="og:site_name" content="Igor's Writing" key="site_name" />

      <meta property="og:type" content="article" key="type" />
      <meta property="og:article:published_time" content={date.toISOString()} key="published_time" />
      { description }
      { ogImage }

      { post.draft ? <meta name="robots" content="noindex" key="robots" /> : null }
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
          <small>{date.format('MMM YYYY')}</small>
        </div>
      </div>

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
        slug: post.slug,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const posts = getPosts()
  const post = posts.find(p => p.slug === params.slug)!
  const body = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    // raw html support
    .use(rehypeRaw)
    // @ts-ignore -- this has some kind of typing issue
    .use(rehypePrism, { ignoreMissing: true })
    .use(rehypeFormat)
    .use(rehypeSlug)
    .use(bootstrapize)
    .use(rehypeStringify)
    .process(post.content)

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

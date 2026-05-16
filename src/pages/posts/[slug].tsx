import Head from 'next/head'

import dayjs from 'dayjs'

import { getPosts, makePostBody } from '../../lib/posts'
import type { Post } from '../../lib/posts'
import ChocolateCalculator from '../../components/ChocolateCalculator'
import GistEmbed from '../../components/GistEmbed'

const MARKER_RE = /<!--\s*(CHOCOLATE_CALCULATOR|GIST_EMBED:\S+(?:\s+height=\d+)?)\s*-->/g;
const GIST_RE = /^GIST_EMBED:(\S+?)(?:\s+height=(\d+))?$/;

type BodySegment =
  | { kind: 'html'; html: string }
  | { kind: 'chocolate' }
  | { kind: 'gist'; url: string; height?: number };

function parseBody(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  let lastIndex = 0;
  for (const match of Array.from(body.matchAll(MARKER_RE))) {
    const before = body.slice(lastIndex, match.index);
    if (before) segments.push({ kind: 'html', html: before });
    const token = match[1];
    if (token === 'CHOCOLATE_CALCULATOR') {
      segments.push({ kind: 'chocolate' });
    } else {
      const gistMatch = token.match(GIST_RE);
      if (gistMatch) {
        segments.push({
          kind: 'gist',
          url: gistMatch[1],
          height: gistMatch[2] ? parseInt(gistMatch[2], 10) : undefined,
        });
      }
    }
    lastIndex = match.index + match[0].length;
  }
  const tail = body.slice(lastIndex);
  if (tail) segments.push({ kind: 'html', html: tail });
  return segments;
}

export default function Post({ post, body }: { post: Post, body: string }) {
  const title = `Igor47 - ${ post.title }`
  const date = dayjs(post.date)
  const canonicalUrl = `https://igor.moomers.org/posts/${post.slug}`

  const descriptionMeta = post.description ? (<>
    <meta name="description" content={ post.description } key="description" />
    <meta property="og:description" content={ post.description } key="og_description" />
  </>) : null

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
    const absoluteImage = (new URL(post.image, "https://igor.moomers.org")).toString()
    ogImage = <meta property="og:image" content={ absoluteImage } key="image" />
  }

  return (<>
    <Head>
      <title>{title}</title>
      <link rel="canonical" href={ canonicalUrl } key="canonical" />
      <meta property="og:title" content={ post.title } key="title" />
      <meta property="og:url" content={ canonicalUrl } key="url" />

      <meta property="og:site_name" content="Igor's Writing" key="site_name" />

      <meta property="og:type" content="article" key="type" />
      <meta property="article:published_time" content={date.toISOString()} key="published_time" />
      { descriptionMeta }
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

      <div className="pt-3">
        {parseBody(body).map((segment, i) => {
          if (segment.kind === 'html') {
            return <div key={i} dangerouslySetInnerHTML={{ __html: segment.html }} />
          }
          if (segment.kind === 'chocolate') {
            return <ChocolateCalculator key={i} />
          }
          return <GistEmbed key={i} url={segment.url} height={segment.height} />
        })}
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
  const body = await makePostBody(post)

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

import { getPosts } from '../../lib/posts'
import type { Post } from '../../lib/posts'


export default function Post() {
  return <>Redirecting...</>
}

export async function getStaticPaths() {
  const posts = getPosts()

  return {
    paths: posts.map(post => ({
      params: {
        oldid: post.id.slice(11)
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const posts = getPosts()
  const post = posts.find(p => p.id.slice(11) === params.oldid)!

  return {
    redirect: {
      permanent: true,
      destination: `/posts/${post.id}`,
    }
  }
}


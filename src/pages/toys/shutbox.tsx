import Head from 'next/head'

import Shutbox from '@/components/Shutbox'

export default function ShutboxPage() {
    return (<>
      <Head>
        <title>Shutbox</title>

        <meta property="og:title" content="Shutbox" key="title" />
        <meta name="description" content="Shutbox -- a very simple game." key="description" />
        <meta property="og:url" content="https://igor.moomers.org/toys/shutbox" key="url" />
      </Head>

      <main>
        <Shutbox />
      </main>
    </>);
}

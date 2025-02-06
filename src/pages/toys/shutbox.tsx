import Head from 'next/head'

import Shutbox from '@/components/Shutbox'

import DiceImg from '@/../public/images/dice.png'

export default function ShutboxPage() {
  const diceUrl = (new URL(DiceImg.src, "https://igor.moomers.org")).toString();

  return (<>
    <Head>
      <title>Shutbox</title>

      <meta property="og:title" content="Shutbox" key="title" />
      <meta name="description" content="Shutbox -- a very simple game." key="description" />
      <meta property="og:url" content="https://igor.moomers.org/toys/shutbox" key="url" />
      <meta property="og:image" content={diceUrl} key="image" />
    </Head>

    <main>
      <Shutbox />
    </main>
  </>);
}

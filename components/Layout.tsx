import Head from 'next/head'

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Igor47 - Home</title>
        <meta name="description" content="Igor's internet home page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.ico" />
      </Head>

      {children}
    </>
  )
}

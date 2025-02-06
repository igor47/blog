import { ReactNode } from 'react'

import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

import { clsx } from 'clsx'
import { Linkedin, Github, Headphones, House, ArrowReturnLeft, ChevronBarUp, CalendarCheck, PersonCircle } from 'react-bootstrap-icons'

import Me from '../../public/images/me.jpg'
import MeHero from '../../public/images/me-sailing.jpg'
import { useRouter } from 'next/router'

function Socials() {
  return (
    <div className="d-flex flex-row justify-content-center py-md-2 border-md-bottom">
      <a href="https://github.com/igor47" className="my-0 mx-2 link-secondary">
        <Github size="20px" title="My Github" />
      </a>

      <a href="https://www.linkedin.com/in/igor47" className="my-0 mx-2 link-secondary">
        <Linkedin size="20px" title="Professional profile" />
      </a>

      <a href="https://www.last.fm/user/igor47" className="my-0 mx-2 link-secondary">
        <Headphones size="20px" title="What I'm Listening To" />
      </a>
    </div>
  )
}

function FaceImg() {
  return (
    <Image
      src={Me}
      alt="My Face"
      width="134"
      height="134"
      sizes="(max-width: 576px) 30vw, 20vw"
      className="rounded-circle border border-2 border-secondary"
      style={{ objectFit: "cover", objectPosition: "left", overflow: "hidden" }}
    />
  )
}

function NavLinks() {
  const router = useRouter();
  const curPath = router.pathname;

  const linkClsx = (path: string) => clsx(
    "py-1 py-md-2",
    {"link-secondary": curPath !== path }, { "link-dark": curPath === path });

  return (
    <div id="Nav" className="d-flex flex-column">
      <Link href="/" className={ linkClsx("/") }>
        <House size="30" className="my-0 mx-2" />
        <span className="align-baseline">Home</span>
      </Link>

      <Link href="/about" className={ linkClsx("/about") }>
        <PersonCircle size="30" className="my-0 mx-2" />
        <span className="align-baseline">About</span>
      </Link>

      <Link href="/now" className={ linkClsx("/now") }>
        <CalendarCheck size="30" className="my-0 mx-2" />
        <span className="align-baseline">Now</span>
      </Link>
    </div>
  )
}


function Nav() {
  return (
    <div className="d-flex flex-row flex-md-column">
      <div id="Info" className="d-flex flex-column justify-content-center">
        <Link href="/" className="link-secondary align-self-center">
          <FaceImg />
        </Link>

        <div className="d-flex flex-column justify-content-center">
          <h3 className="mx-auto text-nowrap">
            <Link href="/about" className="link-dark">Igor Serebryany</Link>
          </h3>
          <div className="mx-auto text-secondary d-none d-md-block">Software & Hardware</div>
        </div>

        <Socials />
      </div>

      <div className="d-flex flex-grow-1 align-items-center justify-content-center mt-md-2">
        <NavLinks />
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div className="d-flex justify-content-center border-top border-2 py-2 mt-2 border-md-0 py-md-4 mt-md-4 justify-content-md-left ps-md-5">
      <Link href="/" className="link-secondary px-3 border-end border-2">
        <ArrowReturnLeft size="24" title="Return" />
        <House size="24" title="Home" />
      </Link>

      <a href="#top" className="link-secondary px-3 border-end border-2"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <ChevronBarUp size="24" />
      </a>

      <div className="text-secondary px-3">
        Drop me a line! <span className="text-primary">igor47@</span>
      </div>
    </div>
  )

}

export default function Layout({ children }: { children: ReactNode }) {
  const heroUrl = (new URL(MeHero.src, "https://igor.moomers.org")).toString();

  return (
    <>
      <Head>
        <title>Igor47 - Home</title>
        <meta name="description" content="Igor's internet home page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta property="og:site_name" content="Igor's Website" key="site_name" />

        <meta property="og:type" content="website" key="type" />
        <meta property="og:title" content="Igor47 - Home" key="title" />
        <meta property="og:description" content="Igor's internet home page and blog" key="description" />
        <meta property="og:image" content={heroUrl} key="image" />

        <link rel="manifest" href="/site.webmanifest" />

        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png"/ >
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container-fluid">
        <div className="row pt-2">
          <div className="col-12 col-md-3">
            <Nav />
          </div>

          <div className="col-12 mt-2 d-md-none border-bottom">
          </div>

          <div
            className="col-12 col-md-9 mt-3 mt-md-0"
            style={{ maxWidth: '60em' }}
          >
            {children}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

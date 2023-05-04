import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

import { Linkedin, Github, StackOverflow, House, ArrowReturnLeft, ChevronBarUp } from 'react-bootstrap-icons'

import Me from '../public/images/me.jpg'

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Igor47 - Home</title>
        <meta name="description" content="Igor's internet home page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.ico" />
      </Head>

      <div className="container-fluid">
        <div className="row pt-2">
          <div className="col-12 col-md-3">
            <div className="d-flex flex-row flex-md-column">
              <Link href="/" className="link-secondary align-self-center"><Image
                src={Me}
                alt="My Face"
                width="134"
                height="134"
                sizes="(max-width: 576px) 30vw, 20vw"
                className="rounded-circle border border-2 border-secondary"
                style={{ objectFit: "cover", objectPosition: "left", overflow: "hidden" }}
              /></Link>

              <div className="d-flex justify-content-center flex-column flex-md-row ps-4 ps-md-0 pt-md-4 text-secondary">
                <a href="https://github.com/igor47" className="my-2 mv-md0 mx-md-2 link-secondary">
                  <Github size="24px" title="My Github" />
                </a>

                <a href="https://www.linkedin.com/in/igor47" className="my-2 mv-md0 mx-md-2 link-secondary">
                  <Linkedin size="24px" title="Professional profile" />
                </a>

                <a href="https://www.linkedin.com/in/igor47" className="my-2 mv-md0 mx-md-2 link-secondary">
                  <StackOverflow size="24px" title="My StackOverflow" />
                </a>
              </div>

              <div className="d-flex justify-content-center flex-column ps-4 ps-md-0 pt-md-4">
                <h3 className="mx-auto">Igor Serebryany</h3>
                <div className="mx-auto text-secondary">Software & Hardware</div>
              </div>

            </div>
          </div>

          <div className="col-12 col-md-9 mt-2 mt-md-0">
            <div style={{ maxWidth: '85rem' }}>{children}</div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-center border-top border-2 py-2 border-md-0 py-md-4 justify-content-md-left ps-md-5">
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
    </>
  )
}

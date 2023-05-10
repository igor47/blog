import Head from 'next/head'
import Link from 'next/link'

export default function About() {
  return (<>
    <Head>
      <title>Igor47 - About</title>

      <meta property="og:title" content="Igor Serebryany" key="title" />
      <meta name="description" content="About Igor Serebryany's life, interests, and career" key="description" />

      <meta property="og:type" content="profile" key="type" />
      <meta property="og:profile:first_name" content="Igor" />
      <meta property="og:profile:last_name" content="Serebryany" />
      <meta property="og:profile:username" content="igor47" />
    </Head>

    <main>
      <div className="row mb-3">
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <img
            src="/images/me_hero.jpg"
            alt="Igor Serebryany"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
            }}
          />
        </div>
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <h3 className="text-nowrap">Hello! I'm Igor.</h3>

          <p className="lead">
            I make things.
            I love humans, nature, our planet, science, ideas, and anything else that gets people talking.
            I am always curious.
          </p>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <h3 className="text-end">Software</h3>

          <p>
            My typical medium, and most of my professional experience, is in software.
            At Airbnb, I was an early engineer on the SRE team, and helped scale both the team and the infrastructure through hypergrowth.
          </p>
        </div>

        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <img
            src="/images/my_screen.png"
            alt="A screenshot of my coding environment"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <img
            src="/images/me_ghu.jpg"
            alt="Giving a talk at GitHub Universe"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
            }}
          />
        </div>

        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <h3>Tools</h3>

          <p>
            I am fascinated by how people use technology, and I love to build tools.
            At Airbnb, I founded and lead the Developer Happiness team, which focused on internal infrastructure.
            I have also built tools for data scientists at <Link href="/posts/building-etl-kubernetes">Aclima</Link> and for non-techinical users at <a href="https://app.recoolit.com">Recoolit</a>.
          </p>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <h3 className="text-end">Open-source</h3>

          <p>
            I care passionately about the community of practice that is software development.
            Open-sourcing my work is one way to contribute back to this community.
            At Airbnb, I open-sourced <a href="https://medium.com/airbnb-engineering/smartstack-service-discovery-in-the-cloud-4b8a080de619">SmartStack</a>, a pioneering approach to distributed inter-service communication which has since been widely adopted in tools like Consul and Envoy.
          </p>
        </div>

        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <img
            src="/images/me_datadog.png"
            alt="Giving a talk about monitoring"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <img
            src="/images/komodo.jpg"
            alt="A bay in the Komodo sea"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
            }}
          />
        </div>

        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <h3>Climate</h3>

          <p>
            I am deeply concerned about the climate crisis, and focus most of my energy here.
            I work in the space as an angel investor, philanthropist, advisor, and technical contributor.
            I have spent several years working building technical infrastructure at Aclima and Recoolit full-time.
            I would <b>love</b> to talk to <b>you</b> about your high-leverage climate idea.
          </p>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <h3 className="text-end">Atoms, not (just) bits</h3>

          <p>
            I love getting off my computer and building stuff in the real world.
            I enjoy electronics, <Link href="/posts/minimal-viable-air-quality">hardware hacking</Link>, woodworking, <Link href="/posts/my-projects-belden-spa">carpentry, and welding</Link>.
            I am always looking for collaborators, especially in mechanical engineering!
          </p>
        </div>

        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <img
            src="/images/my_bench.jpg"
            alt="My messy workbench"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <img
            src="/images/chrysalis_origin.jpg"
            alt="Founding of a co-housing project"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
            }}
          />
        </div>

        <div className="col-6 col-lg-5 d-flex flex-column justify-content-center">
          <h3>Community</h3>

          <p>
            I am embedded in, and a product of, a social context.
            I invest a lot of energy into maintaining this context.
            Besides my professional networks, I have organized burning man camps, campouts, large-scale art projects, and co-housing communities.
            A small group of dedicated individuals is the only thing which has ever changed the world.
            I hope to be part of this group.
          </p>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12 col-lg-10">
          <img
            src="/images/me_with_wings.jpg"
            alt="A final photo of me with electronic wings"
            className="rounded"
            style={{
              width: '100%',
              height: '10rem',
              objectFit: 'cover',
              objectPosition: '50% 10%',
            }}
          />
        </div>
      </div>
    </main>
  </>)
}

export async function getStaticProps() {
  return { props: {} }
}

const oldSlugs = [
  'open-letter-gpe',
  'peter-eckersley',
  'war-in-ukraine',
  'words-i-avoid',
  'kitchen-table-decisions',
  'navigating-arch-on-osx',
  'arch-linux-config',
  'minimal-viable-air-quality',
  'building-etl-kubernetes',
  'aws-mfa-cli-direnv',
  'website-scalability',
  'syncthing',
  'embedded-system-ssh-tunnel',
  'differences-in-environmentalism',
  'individual-action-and-climate',
  'issue-journalism-platform',
  'mailman-behind-https',
  'my-projects-belden-spa',
  'thoughts-on-leaving-airbnb',
  'what-is-to-be-done',
  'the-12v-music-manifesto',
  'heart-disease-in-the-ussr',
  'recovering-openid',
  'smartstack-vs-consul',
  'third-party-domains',
  'recovering-an-android-phone',
  'interview-questions',
  'soviet-kgb-stories-pt1',
  'github-pages-proxying-and-redirects'
]

const newSlugs = {
  'syncthing': 'my-syncthing-setup',
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
  },
  redirects: async () => {
    const redirects = oldSlugs.map((slug) => ({
      source: `/${slug}`,
      destination: `/posts/${newSlugs[slug] ?? slug}`,
      permanent: true,
    }))

    return redirects
  },
  output: "standalone",
}

module.exports = nextConfig

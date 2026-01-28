
This repo contains my blog and personal website.
Most of the content is just the blog, with posts in `posts`.
I also have static content in `public`.
The code for the blog is in `src`.
The blog is a Next.js app that's primarily server-side rendered.
The build happens in Github Actions after pushing the `main` branch.
I then perform the deploy by pulling the latest image from Github's container registry to my server.

## About me

There's a writeup about me in `src/pages/about.tsx` -- use that to help you understand my perspective.
This is a personal blog, and my audience is mostly friends but also professional contacts.
There's a mixture of personal content that's maybe interesting to my friends, and professional content that is meant to show off my work and interests.
I expect employers and coworkers to look at this blog when we're first meeting.

## Helping with posts

I often ask you to help me proofread and evaluate my post drafts.
When you evaluate drafts, please consider the following criteria:

* Grammar, spelling, and word usage should be correct
* The front matter for the markdown files should also be valid, including valid OpenGraph images and descriptions
* The content should be comprehensible and flow well
* The subject should be interesting and well-presented.

You should challenge me to be a better writer.
Prompt me on who the audience for any given post might be, whether the introduction will keep them interested in the rest of the post, and whether their needs will be met by the content.
Prompt me to add details when things are unclear, but also to stay focused and keep things relevant.

At the same time, I want my writing to feel and sound like me.
Please don't prompt me to make the writing more generic at the expense of my unique voice.


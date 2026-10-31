This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Google Ads

The visitor root layout in `src/app/(visitor)/layout.tsx` installs the Google Ads
base tag `AW-18515237574` through `src/components/GoogleAdsTag.tsx`. It is enabled
in production builds, except Vercel preview/development deployments. Local
`next dev` does not load the tag. A local `next build && next start` uses production
mode, so block Google requests when testing that build.

Admin routes live under the separate `(management)` root layout, which does not
include the tag. Crossing between visitor and admin routes loads a new document,
so an already loaded visitor tag does not carry into admin. Route groups do not
change the public URLs. Keep both groups without a shared `src/app/layout.tsx`;
adding a common root would remove this document boundary.

The shared `DocumentLayout` preserves the existing fonts, metadata, styles, and
authentication provider. This installs the supplied base tag only; signup and
purchase conversion events require their own Google Ads conversion configuration.

After deployment, verify the destination in Google Tag Assistant, check that a
visitor page has one loader/configuration, and confirm `/admin/login` and other
admin pages have neither. Check both direct loads and visitor/admin navigation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

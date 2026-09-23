# mfuko-pro-frontend-2026

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Vercel demo domains

For the production build, configure these Vercel environment variables:

- `VITE_BASE_URL=vercel.app`
- `VITE_CENTRAL_DOMAIN=finance-link-frontend-2026.vercel.app`
- `VITE_BACKEND_URL=https://finance-link-backend-2026-production-n5gk0u.laravel.cloud/api/v1`
- `VITE_ENCRYPT_STORAGE`: use the existing frontend storage value.

Redeploy after saving the variables. The central domain opens `/central/login`;
`mfukodemo.vercel.app` opens `/tenant/login` and sends `mfukodemo` as the tenant
subdomain. Create that tenant through central admin before signing in. The central
domain takes precedence over stored tenant context. These frontend routing rules
do not replace backend authentication or tenant authorization.

For a custom domain, use its shared parent as `VITE_BASE_URL` (for example,
`mfukoplus.com`). `VITE_CENTRAL_DOMAIN` is optional when central admin uses that
parent domain directly. Leave both blank for local development with localhost.

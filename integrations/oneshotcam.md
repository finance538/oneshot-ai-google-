# Connecting the oneShot sites

This repository contains the public storefront and payment platform (`flourishing-mooncake-14eb26`). The root route reproduces the public website from `1shotcam.com`; local navigation leads to `/sign-in`, `/sign-up`, and `/dashboard`. The separate deployment at `1shotcam.com` / `lustrous-salmiakki-3375b0` has not been modified. Its source repository was unavailable during the import; see `storefront-source.md` for the copied content and limitations.

The payment platform now accepts `/sign-in` and `/sign-up`. Use these destinations in the other site's source:

```html
<a data-oneshot-auth="login" href="https://flourishing-mooncake-14eb26.netlify.app/sign-in">Sign in</a>
<a data-oneshot-auth="signup" href="https://flourishing-mooncake-14eb26.netlify.app/sign-up">Sign up</a>
```

Deploy the payment platform first. Prefer changing the two button destinations in the other site's React source. If only its HTML entry point can be edited, the bridge can be added before `</body>`:

```html
<script defer src="https://flourishing-mooncake-14eb26.netlify.app/merchant-connect.js"></script>
```

The bridge runs only on `1shotcam.com`, `www.1shotcam.com`, and `lustrous-salmiakki-3375b0.netlify.app`. It targets explicit `data-oneshot-auth` elements, or the last matching sign-in/sign-up buttons, including dynamically rendered buttons. It navigates to the origin hosting the script and never transfers credentials or session tokens. If that site has a Content Security Policy, its `script-src` must allow the payment platform origin. If the payment site later changes domain, update the destinations and script URL accordingly.

This is navigation, not single sign-on. The two sites keep their existing separate account/session systems. Arabic, English, Chinese, and Russian can be selected on the destination; `lang` and `theme` URL parameters carry the display choices without sharing authentication data.

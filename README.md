# PicSet Desktop

PicSet Desktop is a secure Electron shell for the hosted PicSet Web service.

## Architecture

- The app loads one configured HTTPS PicSet Web origin directly.
- The remote page continues to use relative `/api/*` requests. Because those
  requests resolve against the loaded PicSet origin, they remain same-origin
  and keep the Web service's existing Cookie and Origin behavior.
- The desktop shell does not embed the Web server, run an API proxy, disable
  CORS, or expose a Node.js or Electron IPC bridge to the remote renderer.
- The renderer uses Electron sandboxing, context isolation, disabled Node
  integration, and standard web security.
- Same-origin navigation remains in the desktop app. Credential-free external
  HTTPS links open in the operating system browser; other external protocols
  are denied.
- Electron's stock application menu is removed.
- The `/login` page keeps the initial window size. The first authenticated
  same-origin page maximizes the window, and later navigation does not resize it.

## Local Development

Use the Node.js version declared in `.nvmrc`, then install the locked
dependencies:

```bash
npm ci
```

`PICSET_DESKTOP_WEB_URL` must be an HTTPS root origin without credentials, a
path, query string, or fragment. It is intentionally not stored in this
repository.

Start the shell with a non-production address for local verification:

```bash
PICSET_DESKTOP_WEB_URL=https://example.invalid npm start
```

Build a local unpacked directory for smoke testing:

```bash
PICSET_DESKTOP_WEB_URL=https://example.invalid npm run package:dir
```

The generated runtime configuration and `release/` output are ignored. The
installed app contains only the configured public Web origin; it never contains
server credentials or API tokens.

## GitHub Release Setup

Create a protected GitHub Actions Environment named `release`. Add this
Environment Variable:

| Name | Purpose |
| --- | --- |
| `PICSET_DESKTOP_WEB_URL` | Exact public root HTTPS origin served by PicSet Web. |

The workflow reads this through `vars.PICSET_DESKTOP_WEB_URL`. Set it for the
`release` Environment, and do not commit its value to source files.

Optional signing credentials belong only in `release` Environment Secrets:

| Platform | Secret names |
| --- | --- |
| macOS signing and notarization | `MACOS_CERTIFICATE_P12_BASE64`, `MACOS_CERTIFICATE_PASSWORD`, `APPLE_API_KEY_P8_BASE64`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID` |
| Windows signing | `WINDOWS_CERTIFICATE_PFX_BASE64`, `WINDOWS_CERTIFICATE_PASSWORD` |

All credentials for a platform must be present together. A completely absent
platform set creates an unsigned test artifact; a partial set fails its package
job before publication. Certificates and API keys are decoded only into the
runner temporary directory and are not uploaded as build artifacts or release
assets.

## Publishing

1. Update `package.json` to the release version.
2. Run `npm ci` and `npm test`.
3. Commit the version change.
4. Create and push the exact matching tag:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

The tag must exactly equal `v` plus `package.json`'s version. Pushing it runs
the `release` workflow, which verifies the project and creates macOS x64,
macOS arm64, and Windows x64 artifacts. The GitHub Release is created only
after every package job succeeds.

For a recovery build, use **Run workflow** in GitHub Actions and provide an
existing matching `v*` tag.

## Unsigned Builds

Without macOS Developer ID signing and notarization, Gatekeeper can block the
application. Without Windows code signing reputation, SmartScreen can show a
warning. Configure the optional `release` Environment Secrets before broadly
distributing production installers.

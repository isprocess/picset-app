# Electron Desktop Shell Design

## Status

Approved for planning on 2026-07-29.

## Goal

Create a public, standalone Electron repository in the current `app` directory.
It packages a desktop shell for the existing PicSet Web service, without copying
the Web server, its frontend build output, its `.env` file, or any credentials.

The shell supports:

- macOS Intel (`x64`) and Apple Silicon (`arm64`)
- Windows `x64`
- GitHub Release artifacts created by pushing a `v*` tag

The existing Web service remains the only API server. The desktop application
loads that service over HTTPS and the rendered Web page continues to call its
relative `/api/*` endpoints.

## Non-goals

- Do not embed or run the Node Web server in Electron.
- Do not implement a Node.js API proxy, CORS bypass, or renderer IPC bridge.
- Do not implement auto-update, telemetry, crash reporting, or account-specific
  desktop storage.
- Do not commit service URLs, API keys, cookies, certificates, notarization
  keys, passwords, tokens, or generated runtime configuration.

## Repository Layout

The repository root is the Electron project; there is no extra nested desktop
package. The initial product name is `PicSet Desktop` and its application
identifier is `com.picset.desktop`. The initial window opens at 1440 by 900
pixels with a minimum size of 1024 by 700 pixels.

Custom branded icons are not part of this initial scope because no approved
source asset exists in this repository. Electron Builder's fallback application
icon is used until a separately approved PicSet `.icns` and `.ico` asset pair is
added in a future release.

```text
.
|- .github/workflows/release-desktop.yml
|- build/
|  `- entitlements.mac.plist
|- docs/
|  `- superpowers/specs/2026-07-29-electron-desktop-shell-design.md
|- scripts/
|  |- generate-runtime-config.mjs
|  `- assert-release-version.mjs
|- src/
|  |- main.cjs
|  |- runtime-config.cjs
|  `- navigation-policy.cjs
|- test/
|  |- runtime-config.test.mjs
|  |- navigation-policy.test.mjs
|  `- release-version.test.mjs
|- electron-builder.cjs
|- package.json
`- package-lock.json
```

`build/generated/` is ignored by Git. It contains the transient runtime JSON
created during a local package or GitHub Actions job. Electron Builder copies
that JSON into the installed app resources directory.

The Builder configuration uses CJS rather than YAML so it can enable hardened
runtime, signing, and notarization only when the complete platform credential
set is present. This changes no approved release target or runtime behavior.

## Runtime Architecture

### Config Injection

`PICSET_DESKTOP_WEB_URL` is supplied by the GitHub Actions `release`
Environment or repository Actions Variable. It is a public deployment setting,
not a secret.

The package-time generator validates the value before creating the runtime
configuration. It accepts only an HTTPS root origin with these properties:

- a non-empty host
- no user name or password
- no query string or hash
- no path other than an optional root slash

For example, a configured service endpoint must be an origin such as
`https://picset.example.com`, not an API route or an alternate host name.

The generated JSON contains only the validated URL. It is intentionally present
in the installed application because Electron must know which public Web site to
load. It never contains tokens, secrets, or server configuration.

Missing or invalid configuration stops the build before Electron Builder runs.
There is no source-code default, sample production URL, or runtime fallback.

### Electron Process Boundary

The main process creates one `BrowserWindow` and loads the generated HTTPS URL.
It does not serve a local business UI and it does not proxy Web API calls.

The window uses these mandatory settings:

- `sandbox: true`
- `contextIsolation: true`
- `nodeIntegration: false`
- `webSecurity: true`
- no preload script and no renderer-to-main privileged API

The standard persistent Electron session is used. Cookies and browser storage
therefore remain in the operating system user profile, allowing the existing
same-origin PicSet authentication to operate unchanged.

When the loaded page requests `/api/example`, Chromium resolves it against the
remote PicSet origin. The resulting request is same-origin with the loaded page,
so no CORS workaround or Node.js proxy is required. This also preserves the Web
server's existing Cookie and Origin validation behavior.

### Navigation and Permissions

Only navigation within the configured Web origin is permitted in the primary
window. A safe external HTTPS link is opened by the operating system's default
browser. Other navigation protocols are denied.

All runtime permission requests are denied by default. The shell does not expose
filesystem, process, shell, clipboard, notification, or arbitrary IPC access to
the remote Web page. Normal HTML file inputs and browser downloads retain their
normal Chromium behavior without a custom Node bridge.

If the initial remote page fails to load because of network, DNS, TLS, or server
availability problems, the main process shows a generic native dialog with
Retry and Quit choices. It does not display cookies, headers, request bodies,
local paths, or raw server diagnostics.

## Build Outputs

Electron Builder creates the following published files:

| Platform | Architecture | Formats |
| --- | --- | --- |
| macOS | x64 | DMG and ZIP |
| macOS | arm64 | DMG and ZIP |
| Windows | x64 | NSIS EXE |

The first release does not produce Windows arm64 artifacts, a universal macOS
binary, or an auto-update feed. Artifact file names include the application
version and platform architecture so users can choose the correct download.

## GitHub Actions Release Flow

The workflow is stored at `.github/workflows/release-desktop.yml`.

### Trigger and Version Guard

- `push.tags: ["v*"]` starts a release build.
- `workflow_dispatch` requires a `tag` input naming an existing `v*` tag, and
  checks out that exact ref for recovery builds.
- `scripts/assert-release-version.mjs` requires the tag to equal
  `v${package.json.version}`. A mismatch stops the workflow before packaging.

### Jobs

1. `verify` runs on Ubuntu. It installs locked dependencies, validates the
   injected Web URL, and runs the Node test suite.
2. `package` runs after `verify` with a macOS x64 target, macOS arm64 target,
   and Windows x64 target. Every matrix job performs its own locked install,
   tests, generated-config validation, and Electron Builder package command.
3. Each successful package job uploads only its release candidates as a
   short-lived GitHub Actions Artifact.
4. `release` runs only after every package target succeeds. It downloads the
   candidates. If the matching GitHub Release does not exist, it creates one
   with generated notes; if it already exists, it replaces matching assets.
   It uploads only `.dmg`, `.zip`, and `.exe` files.

The release job has `permissions: contents: write`. It uses the GitHub-provided
workflow token through `GH_TOKEN`; it does not use a personal access token.
Packaging failure on any target prevents the release job from publishing a
partial cross-platform release.

### Configuration Scope

All release jobs use the protected GitHub Actions Environment named `release`.
`PICSET_DESKTOP_WEB_URL` can be defined as a `release` Environment Variable or
a repository Actions Variable. The workflow reads it through the `vars` context
and passes it to the configuration generator as an environment variable.

The workflow must never echo the generated config or any Secrets to job output.
Build logs can name the configuration variable but must not print its value.

## Signing and Notarization

Unsigned artifacts are allowed for early testing. The workflow supports signed
production artifacts only when the following `release` Environment Secrets are
configured:

| Purpose | Secret names |
| --- | --- |
| macOS Developer ID signing | `MACOS_CERTIFICATE_P12_BASE64`, `MACOS_CERTIFICATE_PASSWORD` |
| macOS notarization API key | `APPLE_API_KEY_P8_BASE64`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID` |
| Windows code signing | `WINDOWS_CERTIFICATE_PFX_BASE64`, `WINDOWS_CERTIFICATE_PASSWORD` |

The workflow decodes an available certificate or API key only into the runner's
temporary directory. It passes temporary paths and passwords to Electron
Builder using job-scoped environment variables. No certificate, decoded key,
or password is written into the repository, build artifact, release artifact,
or log output.

When the complete secret set for a platform is absent, that platform packages
unsigned rather than attempting a partial signing configuration. The README
will describe that unsigned macOS builds can be blocked by Gatekeeper and
unsigned Windows builds can receive SmartScreen reputation warnings.

## Tests and Verification

The Node test suite covers:

- acceptance of valid HTTPS root origins
- rejection of missing, insecure, credential-bearing, path-bearing, query, and
  hash-bearing URL values
- generated runtime JSON containing only the expected URL field
- same-origin navigation allowance and external HTTPS handling
- rejection of unsafe protocols and cross-origin navigation
- tag and package-version equality

The CI release flow verifies the test suite before every platform package and
requires each package command to complete successfully before creating a
release. Tests use synthetic URL values and do not access a production service,
authenticate, or require any sensitive configuration.

## Acceptance Criteria

1. A local development or CI build fails clearly without a valid
   `PICSET_DESKTOP_WEB_URL`.
2. A packaged app loads the configured HTTPS PicSet Web origin and allows the
   current Web UI to use its relative `/api/*` endpoints without a Node proxy.
3. The remote renderer has no Node integration, preload bridge, disabled web
   security, or CORS bypass.
4. Pushing a matching `vX.Y.Z` tag produces macOS x64, macOS arm64, and Windows
   x64 install artifacts, then uploads them to the corresponding GitHub Release.
5. A failed test or package job prevents Release publication.
6. The tracked repository, Actions logs, and Release assets do not contain
   credentials, certificates, or tokens. The packaged runtime configuration
   contains only the required public service URL and no other server data.

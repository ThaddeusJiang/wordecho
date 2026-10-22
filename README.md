# WordEcho

Hear English words without leaving your conversation. WordEcho displays compact cards with a word, IPA, contextual meaning, and inline **US** then **UK** pronunciation links.

See [GitHub Releases](https://github.com/ThaddeusJiang/wordecho/releases) for published versions and the [changelog](ChangeLog.md) for their changes.

Audio plays only after a click, from remote Youdao URLs. WordEcho does not use local text-to-speech or browser speech synthesis. Clicking another pronunciation interrupts the current audio.

## Demo

https://github.com/user-attachments/assets/1d80bd2e-c232-4dcf-aeeb-c71a1d5ba4ec

Play the 15-second demo above and unmute the player to hear US/UK pronunciation. [Download the MP4](assets/demo/wordecho-demo.mp4).

This browser preview records the real player and US/UK clicks for **finance** and **ledger**, with IPA and Chinese meanings supplied through the tool. The MP4 uses pronunciation clips from the same Youdao URLs as the player, synchronized to the recorded clicks; it is not a live system-audio capture. Blue outlines highlight each selection, and an optional English subtitle track is included. It is not a recording of a Codex chat card. Third-party pronunciation audio is not covered by this repository's MIT license.

## Install in Codex

### Let your agent install and try it

Copy this prompt into a local Codex agent with terminal access:

```text
Read https://github.com/ThaddeusJiang/wordecho and follow its README to install and verify WordEcho, then use it to show finance and ledger with IPA, Chinese meanings, and clickable US/UK pronunciation.
```

The plugin includes [voice-dictionary](plugins/openai/skills/voice-dictionary/SKILL.md); no separate skill installation is needed. Playback verification may require your click or a new local task after installation.

### Requirements

- Node.js 22 or newer, available as `node` on your PATH.
- Git, for Codex to fetch the plugin repository. pnpm is only needed for development.
- A Codex CLI version that supports `codex plugin marketplace` and portable plugins. Tested with Codex CLI 0.158.0.
- An internet connection for audio. Inline cards require a host that supports MCP Apps; CLI-only clients do not provide the same playback UI.

### Install (two commands)

```sh
codex plugin marketplace add ThaddeusJiang/wordecho
codex plugin add wordecho@thaddeusjiang
```

The repository includes a ready-to-run server bundle. You do not need to clone manually, install npm dependencies, or build it. Node.js is still required to run it.

`wordecho` is the plugin name; `thaddeusjiang` is the publisher's marketplace name, not a version. The first command registers that source; the second installs the plugin from it.

This repository is public; no repository access grant is needed to install it.

In a local Codex task, select WordEcho from the plugin picker or mention it, then ask:

> Show finance and ledger with IPA and Chinese meanings. Let me click US or UK to hear them.

Each card has the word, IPA, contextual meaning, and US/UK playback links. IPA and meanings are supplied by the assistant; the tool does not look them up or verify them. It does not autoplay.

### Check installation

```sh
codex plugin list --json
codex mcp list --json
```

WordEcho should be installed and enabled. Its MCP server should use the installed `dist/server.cjs` entrypoint.

If a card shows an older layout, request a new card after the host loads the updated plugin. Existing cards can retain old resources. If the tool is missing, check plugin enablement and try a new local task; some hosts may require restarting to refresh their runtime. Reinstalling alone does not prove an active chat has reloaded.

### Update

```sh
codex plugin marketplace upgrade thaddeusjiang
codex plugin add wordecho@thaddeusjiang
```

### Uninstall

```sh
codex plugin remove wordecho@thaddeusjiang
```

## Browser preview

For development, clone and build the source as described below, then run:

```sh
pnpm run start
```

Open `http://127.0.0.1:43187/?word=finance`. This standalone preview shows the word and playback links; it does not retrieve IPA or translations. Full cards receive those optional fields through the assistant's tool call.

The HTTP MCP endpoint is `http://127.0.0.1:43187/mcp`. Without `--http`, the generated server uses stdio. The preview binds to loopback by default. Stop it with Ctrl+C.

This is a local install, **not** a public ChatGPT marketplace listing. Installing it does not deploy a remote service or connect ChatGPT Web. A web connection requires a separately hosted HTTPS MCP endpoint.

## Architecture

```text
plugins/
  openai/
    app/server.mjs         Codex/ChatGPT MCP adapter
    skills/                Vocabulary workflow
    dist/                  Ready-to-run server and license notices
packages/
  core/pronunciation.mjs   Shared validation and remote audio URLs
  player/                 Shared HTML player and styles
scripts/build.mjs         Build the adapter and embedded player
tests/                    Focused validation and integration tests
.agents/plugins/          Local marketplace definition
```

The app-router-style layout separates `plugins/<platform>/app/` host bindings from shared `packages/` code. Future adapters can reuse the core and player. Only the OpenAI adapter is implemented.

## Development

Development requires pnpm 10.15.1 (install with `npm install --global pnpm@10.15.1`). Clone the source and install the pinned dependencies:

```sh
git clone https://github.com/ThaddeusJiang/wordecho.git
cd wordecho
pnpm install --frozen-lockfile
```

Run checks relevant to your change:

```sh
pnpm run build
pnpm run test:core
node --test tests/player.test.mjs tests/package.test.mjs
node --test tests/distribution.test.mjs
pnpm run test:mcp
```

The HTTP integration test requires the local preview server:

```sh
node --test tests/http.test.mjs
```

For source changes, rebuild and commit `plugins/openai/dist/server.cjs`, its LICENSE, and THIRD_PARTY_LICENSES.txt together. This keeps Git-backed installation ready to run and preserves bundled dependency notices. To test a checkout as a local source, run `codex plugin marketplace add .` after building.

### Earlier local installs

The old marketplace was called `wordecho-local`. Existing installations are not silently removed. After the new installation works, you can remove the old plugin with `codex plugin remove wordecho@wordecho-local`. Do not keep both copies enabled: both expose the same MCP server name.

## Audio, privacy, and limitations

- Clicking a pronunciation sends the selected word to Youdao, along with normal network request information such as your IP address. Do not use sensitive text as pronunciation input.
- The source uses `https://dict.youdao.com/dictvoice`: `type=2` for US and `type=1` for UK. Availability, accuracy, and coverage are not guaranteed. Playback errors are shown; synthesized audio is never substituted.
- The plugin bundle contains no audio recordings; it retrieves remote audio after a click. The demo MP4 includes four short Youdao pronunciation clips. Third-party audio, services, trademarks, and dependencies have their own terms and licenses; this repository's MIT license does not cover them.
- WordEcho is not affiliated with Youdao or OpenAI. Formal permission for commercial use of Youdao's endpoint has not been established. Check the provider's current terms or obtain permission before offering a public or commercial service based on it.
- A build or MCP response does not prove every host can render or play inline cards.

## License and attribution

Copyright 2026 ThaddeusJiang.

WordEcho's original source is licensed under [MIT](LICENSE). Retain the copyright and permission notices when distributing copies or substantial portions of the software. This grants no rights to third-party audio. Dependencies retain their own licenses; if you distribute generated bundles, include their applicable licenses and notices as well.

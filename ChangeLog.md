# Changelog

This file records changes in published WordEcho versions. Dates use YYYY-MM-DD.

## [Unreleased]

## [0.1.2] - 2026-10-22

### Added

- Up to three complete examples per word, each with a Chinese meaning and separate US and UK playback links. The skill supplies one or two examples from programmer or technical-document contexts.
- An animated chat demo with Chinese narration, subtitles, and word/example audio. It is a scene animation, not an app recording. Earlier demos are retained.

### Changed

- Words remain the visual focus. Examples use smaller, plain text below each word.
- Phrases and complete examples use remote Google TTS. Single words use Youdao, with remote Google TTS as a fallback.
- The plugin version, UI resource, audio domain allowlist, and prebuilt bundle are updated to 0.1.2.

### Fixed

- Complete English sentences with punctuation are accepted, up to 120 characters per item.
- Audio requests omit the Referer header so Google TTS can play in the browser.
- Playback failures show timeout, retry, and host-blocked messages.

## [0.1.1] - 2026-10-22

First GitHub Release from the main branch.

### Added

- Compact English word cards with optional IPA and contextual meanings supplied by the assistant.
- US then UK playback links for remote Youdao audio. Playback starts after a click; a new selection stops the previous audio.
- A bundled voice-dictionary skill for use in conversations.
- A local stdio MCP server, an MCP App player, and a loopback HTTP preview.
- A prebuilt plugin bundle for Node.js 22 or newer, with license notices.
- Installation instructions and a demo with audio for finance and ledger.

### Limitations

- IPA and meanings are supplied by the assistant and are not verified by the tool.
- Playback needs internet access and a host that supports MCP Apps. Audio service availability and coverage can vary.
- Third-party audio is not covered by the repository's MIT license.

[Unreleased]: https://github.com/ThaddeusJiang/wordecho/compare/v0.1.2...main
[0.1.2]: https://github.com/ThaddeusJiang/wordecho/releases/tag/v0.1.2
[0.1.1]: https://github.com/ThaddeusJiang/wordecho/releases/tag/v0.1.1

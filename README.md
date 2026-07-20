# Tone Fixer

**Rewrite any text in the perfect tone — Polite, Casual, or Formal. A Chrome extension powered by Groq (free), Claude, ChatGPT, Gemini, or Grok.**

## Features

- **Multiple AI providers** — Choose from Groq (free, no billing required), Claude, ChatGPT, Gemini, or Grok
- **Three tone modes** — Polite, Casual, Formal
- **Smart formatting** — Send to Teams/Chat or Email with auto-adjusted output
- **Dark terminal theme** — Matches the developer's portfolio aesthetic
- **Copy to clipboard** — One-click copy of the rewritten text
- **Privacy-first** — Your API key stays in local storage; no data sent anywhere except the AI provider you choose

## Installation

1. Download or clone this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `tone-fixer` folder
5. Click the extension icon in the toolbar to open the popup

## Usage

1. Open the popup and paste your text
2. Select a tone (Polite / Casual / Formal)
3. Choose the target destination (Teams/Chat or Email)
4. Click **Generate**
5. Copy the result with one click

> **First time?** Open Settings and enter an API key for your preferred provider. Groq offers a free tier — no credit card required.

## Providers

| Provider | API Key Needed | Model | Free Tier |
|----------|---------------|-------|-----------|
| Groq | Yes | llama-3.3-70b-versatile | Yes |
| Claude | Yes | claude-sonnet-4-5 | No |
| ChatGPT | Yes | gpt-4o | No |
| Gemini | Yes | gemini-2.0-flash | No |
| Grok | Yes | grok-4.5 | No |

## Configuration

Open the extension settings to:
- Select your AI provider
- Enter your API key
- Toggle between providers

## Development

```
git clone https://github.com/shreyashp47/tone-fixer.git
```

No build step required — this is a plain JavaScript Chrome extension (MV3).

## License

MIT

# Negative Lab Converter ChatGPT App Submission Checklist

Last updated: 2026-03-30

## Current app endpoints

- MCP: `https://negative-lab-converter-chatgpt.onrender.com/mcp`
- Preview: `https://negative-lab-converter-chatgpt.onrender.com/preview`
- Health: `https://negative-lab-converter-chatgpt.onrender.com/healthz`

## Required submission assets

- Verified OpenAI organization publisher name
- App name
- App logo
- App description
- Company URL
- Privacy policy URL
- MCP server URL
- Tool list and descriptions
- Screenshots
- Test prompts and expected behavior
- Localization information

## Pre-submit checks

- `https://negative-lab-converter-chatgpt.onrender.com/healthz` returns `200`
- `https://negative-lab-converter-chatgpt.onrender.com/preview` returns `200`
- `https://negative-lab-converter-chatgpt.onrender.com/mcp` responds to `OPTIONS`
- All five tools are present:
  - `open_converter_workspace`
  - `analyze_source_image`
  - `recommend_export_preset`
  - `inspect_format_support`
  - `report_conversion_result`
- The app works in ChatGPT Developer Mode on web
- The app works in ChatGPT mobile before submission
- Privacy policy matches actual returned data
- No hidden debug payloads or unnecessary identifiers are exposed
- Tool annotations match behavior
- Widget has no console errors during core flows

## Recommended submission framing

- Primary value: convert one image inside ChatGPT with local preview and download
- Avoid broad claims like “all RAW formats supported”
- State RAW support as best-effort and preview-first for `CR3` and `CRAW`
- Position the app as a utility, not a storefront

## Monetization note

For this app, do not submit with digital upsells, subscriptions, credits, or desktop purchase prompts inside the ChatGPT app flow.

Current OpenAI policy allows commerce only for physical goods in published apps. This app is a digital software utility, so the ChatGPT app should remain a free utility companion unless OpenAI expands the policy.

## Submission links

- App management: `https://platform.openai.com/apps-manage`
- Submission guidelines: `https://developers.openai.com/apps-sdk/app-submission-guidelines/`
- Submission flow docs: `https://developers.openai.com/apps-sdk/deploy/submission/`

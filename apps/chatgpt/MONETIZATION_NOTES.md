# ChatGPT Monetization Notes

Last updated: 2026-03-30

## Short answer

As of 2026-03-30, this app should not be monetized inside ChatGPT for its current use case.

## Why

Negative Lab Converter is a digital software utility. Current ChatGPT app submission policy says published apps may conduct commerce only for physical goods, and selling digital products or services such as subscriptions, digital content, tokens, or credits is not allowed.

## What is allowed today

- External checkout is the recommended general monetization approach in the Apps SDK docs
- Instant Checkout exists in beta
- But current approval is limited to physical goods purchases

Those two points mean the platform has commerce primitives, but this specific app category is not currently eligible for approved in-ChatGPT monetization.

## Recommended business model

- Keep the ChatGPT app free
- Use it as a utility or acquisition surface
- Monetize the desktop app, Windows installer, macOS build, or future SaaS offering on your own site

## Revisit later

Re-check these docs before adding checkout:

- `https://developers.openai.com/apps-sdk/app-submission-guidelines/#commerce-and-monetization`
- `https://developers.openai.com/apps-sdk/build/monetization/`

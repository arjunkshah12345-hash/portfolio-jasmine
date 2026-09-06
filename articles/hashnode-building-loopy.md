---
title: "Building Loopy: Creating an Autonomous Software Engineer"
description: "What if an AI agent could build an entire product from a single idea? Here's how I built Loopy — an autonomous software engineer that researches, plans, builds, and fixes until the product is done."
tags: ai, agents, programming, typescript, webdev
cover_image: https://arjunshah.xyz/about.jpg
canonical_url: https://arjunshah.xyz/writing
---

Loopy started with a simple question: **what if an AI agent could build an entire product from a single idea?**

Not a prototype. Not a demo. A real product with real code, real commits, real testing, real iteration. You give it an idea, it comes back with a working project.

That's what Loopy aims to be: an **autonomous software engineer** that researches, plans, builds, fixes, and loops until the product is done.

## The Architecture

Loopy is built around **short execution cycles**. After every step, it:

1. Re-reads the current repo state
2. Updates its task list
3. Commits any changes
4. Checks for bugs
5. Plans the next step

This matters because long-running agents have a fundamental problem: **they forget**. A five-minute demo looks great. A five-hour session falls apart. The agent loses track of what it already did, what decisions it made, what bugs it already fixed.

Loopy solves this by treating context as a managed resource. Every loop, the agent reviews what changed, what is still broken, and what the goal actually is. It doesn't guess. It reads the current state and acts.

## The Context Problem

While building Loopy, I hit a wall. The longer the agent ran, the more context it accumulated. Conversations grew to thousands of tokens. Important decisions got buried. The agent started repeating work and losing track of its goals.

This led me to build **Supercompress** — a neural context compression tool that:

- Cuts token usage by ~65%
- Retains ~98.7% of important information
- Preserves decisions, constraints, code references, and state

Supercompress feeds into Loopy to keep context windows manageable without losing signal.

## The Technical Stack

Loopy is built with:

- **TypeScript** for the orchestration layer
- Git integration for version control
- Task tracking for persistent state
- Code analysis tools for understanding existing code
- **Supercompress** for context management

## Current State

Loopy is still early. It works well for some types of projects and struggles with others. But the direction is clear: **autonomous agents that can build real software without constant human supervision.**

The vision is an agent that takes a product idea from zero to shipped — writing real code, making real commits, fixing real bugs — and does it all in a loop that keeps improving.

## Try It

You can see Loopy in action at **[loopy.yachts](https://loopy.yachts)**. The demo video is on [my X profile](https://x.com/arjunkshah21/status/2065643348711428271).

---

*Built by Arjun Shah, a 14-year-old AI founder. Follow my journey on [X](https://x.com/arjunkshah21) or visit [arjunshah.xyz](https://arjunshah.xyz).*

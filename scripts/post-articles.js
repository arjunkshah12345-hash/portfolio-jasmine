#!/usr/bin/env node

/**
 * Post articles to Dev.to and Hashnode programmatically.
 *
 * Usage:
 *   DEVTO_API_KEY=xxx HASHNODE_TOKEN=xxx HASHNODE_PUBLICATION_ID=xxx node scripts/post-articles.js
 *
 * Articles are read from the articles/ directory.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ── Configuration ──────────────────────────────────────────────
const DEVTO_API_KEY = process.env.DEVTO_API_KEY;
const HASHNODE_TOKEN = process.env.HASHNODE_TOKEN;
const HASHNODE_PUBLICATION_ID = process.env.HASHNODE_PUBLICATION_ID;

const ARTICLES_DIR = path.join(__dirname, "..", "articles");

// Maps files to their target platforms
const POSTS = [
  {
    file: "devto-who-is-arjun-shah.md",
    platforms: ["devto"],
  },
  {
    file: "medium-why-i-code.md",
    platforms: [], // Medium API is deprecated — paste manually
  },
  {
    file: "linkedin-winning-stanford-lisa.md",
    platforms: [], // LinkedIn — user said skip
  },
  {
    file: "hashnode-building-loopy.md",
    platforms: ["hashnode"],
  },
  {
    file: "linkedin-86-repos.md",
    platforms: [], // LinkedIn — user said skip
  },
];

// ── Helpers ────────────────────────────────────────────────────

function readFile(filename) {
  const p = path.join(ARTICLES_DIR, filename);
  if (!fs.existsSync(p)) {
    console.error(`  ✗ File not found: ${filename}`);
    return null;
  }
  return fs.readFileSync(p, "utf-8");
}

function httpsRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Dev.to Poster ──────────────────────────────────────────────

async function postToDevto(markdown, title) {
  if (!DEVTO_API_KEY) {
    console.log("  ⏭ Skipping Dev.to — no DEVTO_API_KEY set");
    return false;
  }

  // Extract tags from front matter if present
  let tags = ["ai", "programming", "webdev"];
  const tagMatch = markdown.match(/^tags:\s*\[([^\]]+)\]/m);
  if (tagMatch) {
    tags = tagMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
  }

  const body = JSON.stringify({
    article: {
      title: title || "Untitled",
      published: true,
      body_markdown: markdown,
      tags: tags.slice(0, 4), // Dev.to allows max 4 tags
    },
  });

  const res = await httpsRequest(
    "https://dev.to/api/articles",
    "POST",
    { "api-key": DEVTO_API_KEY },
    body
  );

  if (res.status >= 200 && res.status < 300 && res.body?.url) {
    console.log(`  ✓ Dev.to: ${res.body.url}`);
    return res.body.url;
  } else {
    console.error(`  ✗ Dev.to error (${res.status}):`, JSON.stringify(res.body).slice(0, 300));
    return false;
  }
}

// ── Hashnode Poster ────────────────────────────────────────────

async function postToHashnode(markdown, title) {
  if (!HASHNODE_TOKEN || !HASHNODE_PUBLICATION_ID) {
    console.log("  ⏭ Skipping Hashnode — missing HASHNODE_TOKEN or HASHNODE_PUBLICATION_ID");
    return false;
  }

  // Extract tags
  let tags = ["ai", "programming", "webdev"];
  const tagMatch = markdown.match(/^tags:\s*\[([^\]]+)\]/m);
  if (tagMatch) {
    tags = tagMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
  }

  // Extract slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  // Extract subtitle (first line after --- front matter)
  let subtitle = "";
  const descMatch = markdown.match(/^description:\s*"(.+?)"/m);
  if (descMatch) subtitle = descMatch[1].slice(0, 156);

  // Remove front matter from markdown content
  let cleanMarkdown = markdown.replace(/^---[\s\S]*?---\n*/, "").trim();

  const query = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          url
          title
        }
      }
    }
  `;

  const variables = {
    input: {
      publicationId: HASHNODE_PUBLICATION_ID,
      title,
      slug,
      contentMarkdown: cleanMarkdown,
      subtitle,
      tags: tags.slice(0, 5)

    },
  };

  const body = JSON.stringify({ query, variables });

  const res = await httpsRequest(
    "https://gql.hashnode.com",
    "POST",
    { Authorization: HASHNODE_TOKEN },
    body
  );

  if (res.status >= 200 && res.status < 300 && !res.body?.errors) {
    const url = res.body?.data?.publishPost?.post?.url;
    if (url) {
      console.log(`  ✓ Hashnode: ${url}`);
      return url;
    }
  }

  console.error(`  ✗ Hashnode error:`, JSON.stringify(res.body?.errors || res.body).slice(0, 300));
  return false;
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Posting Articles ===\n");

  let posted = 0;
  let failed = 0;

  for (const post of POSTS) {
    const markdown = readFile(post.file);
    if (!markdown) {
      failed++;
      continue;
    }

    // Extract title from front matter or first heading
    let title = "Untitled";
    const titleMatch = markdown.match(/^title:\s*"(.+?)"/m) || markdown.match(/^title:\s*(.+?)$/m);
    if (titleMatch) title = titleMatch[1];

    console.log(`\n📄 ${title}`);

    for (const platform of post.platforms) {
      if (platform === "devto") {
        const ok = await postToDevto(markdown, title);
        if (ok) posted++;
        else failed++;
      } else if (platform === "hashnode") {
        const ok = await postToHashnode(markdown, title);
        if (ok) posted++;
        else failed++;
      }
    }
  }

  console.log(`\n=== Done: ${posted} posted, ${failed} failed ===\n`);

  // Show manual instructions for platforms without API
  console.log("📝 Manual posting needed for:");
  console.log("  - Medium (API deprecated — paste from articles/medium-why-i-code.md)");
  console.log("  - LinkedIn (skipped per your request)");
  console.log("  - Substack (optional — if you set one up)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

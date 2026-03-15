#!/usr/bin/env python3
"""Generate and post a Jasmine promo tweet via Gemini + xurl.

Usage (env vars required):
  GEMINI_API_KEY=... XURL_APP=jasmine python3 scripts/hourly_post.py

Notes:
- Requires `xurl` to be installed and authenticated for the chosen app/user.
- Exits non‑zero on failure so cron logs will show issues.
"""
import json
import os
import random
import subprocess
import sys
import time
import urllib.request
import urllib.error


def load_dotenv(path: str = ".env"):
    """Lightweight .env loader to avoid extra deps."""
    if not os.path.exists(path):
        return
    with open(path, "r") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            if key not in os.environ:
                os.environ[key] = val


load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
SITE_URL = os.getenv("SITE_URL", "https://www.arjunshah.xyz")
XURL_APP = os.getenv("XURL_APP", "jasmine")
MAX_LEN = 270  # leave room for link/metadata
POST_MODE = os.getenv("POST_MODE", "draft").lower()  # "live" posts to X; anything else saves drafts
DRAFT_FILE = os.getenv("DRAFT_FILE", "draft_posts.txt")

STYLE_PROMPT = """
You are writing a single X (Twitter) post that promotes Jasmine (an AI frontend engineer) in the voice and tone of arjunshah.xyz: minimal, calm, confident, founder-driven. Avoid hashtags. Sometimes include the site link {site_url}; not every time. Vary length: sometimes short (<=160 chars), sometimes medium (<=220), sometimes long (<=270). Keep it first-person, focused on product taste, craft, and speed. No emojis.
"""

def gemini_generate():
    if not GEMINI_KEY:
        sys.stderr.write("GEMINI_API_KEY is not set\n")
        sys.exit(1)
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key=" + GEMINI_KEY
    lengths = [160, 220, 270]
    target_len = random.choice(lengths)
    include_link = random.random() < 0.6
    prompt = STYLE_PROMPT.format(site_url=SITE_URL)
    prompt += f"\nTarget length <= {target_len} characters. Include site link: {include_link}."
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"Gemini HTTP error {e.code}: {e.read().decode('utf-8', errors='ignore')}\n")
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"Gemini request failed: {e}\n")
        sys.exit(1)

    try:
        text = res["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        sys.stderr.write(f"Unexpected Gemini response: {json.dumps(res)[:400]}\n")
        sys.exit(1)
    return text.strip()


def trim(text: str) -> str:
    t = " ".join(text.split())  # normalize whitespace
    if len(t) <= MAX_LEN:
        return t
    # try soft trim at sentence boundary
    for sep in [". ", "; ", ", "]:
        parts = t.split(sep)
        acc = []
        for p in parts:
            candidate = sep.join(acc + [p]) + (sep if sep.strip() else "")
            if len(candidate) + 3 > MAX_LEN:
                break
            acc.append(p)
        if acc:
            t = sep.join(acc).strip()
            break
    if len(t) > MAX_LEN:
        t = t[:MAX_LEN-1].rstrip()
    if not t.endswith("…"):
        t = t.rstrip(".,; ") + "…"
    return t


def post(text: str):
    cmd = ["xurl", "--app", XURL_APP, "post", text]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"xurl post failed: {e.stderr or e.stdout}\n")
        sys.exit(1)


def save_draft(text: str):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {text}\n"
    with open(DRAFT_FILE, "a", encoding="utf-8") as fh:
        fh.write(line)
    print(f"[draft] {text}")


def main():
    raw = gemini_generate()
    final = trim(raw)
    if POST_MODE == "live":
        post(final)
        print(final)
    else:
        save_draft(final)


if __name__ == "__main__":
    main()

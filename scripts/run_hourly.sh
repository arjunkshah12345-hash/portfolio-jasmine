#!/bin/zsh
cd /Users/arjunkshah21/Downloads/minimalist-portfolio-jasmine || exit 1
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
POST_MODE=${POST_MODE:-draft}
/usr/bin/env python3 scripts/hourly_post.py >> hourly_post.log 2>&1

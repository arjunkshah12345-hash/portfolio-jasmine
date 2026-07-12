// ─── Server-side NEAT Flappy Bird Evolution ─────────────────────
// This endpoint is the SINGLE SOURCE OF TRUTH for the brain state.
// Vercel Hobby plan runs a single serverless instance, so ALL visitors
// hit the same in-memory state — everyone sees the SAME bird and score.
//
// GitLab CI pings /api/evolve every 10 min to keep the instance warm
// and advance evolution. Clients fetch /api/evolve?stats=1 to get the
// current brain weights + best score.
//
// On cold start, hydrates from latest-brain.json (deployed with project).
// On each evolution, also writes to latest-brain.json as a fallback.

const fs = require('fs');
const path = require('path');

const BRAIN_FILE = path.join(__dirname, '..', 'latest-brain.json');

// ─── Config (matching vortex-flappy.js) ────────────────────────
const POPULATION_SIZE = 50;
const INPUT_SIZE = 4;
const HIDDEN_SIZE = 6;
const OUTPUT_SIZE = 1;
const MUTATION_RATE = 0.1;
const GRAVITY = 0.9;
const FLAP_SPEED = -14;
const GROUND_HEIGHT = 112;
const PIPE_SPEED = 4;
const PIPE_GAP = 150;
const PIPE_HORIZONTAL_GAP = 220;
const GAME_WIDTH = 320;
const GAME_HEIGHT = 480;
const GENERATIONS_PER_RUN = 400;
const FRAMES_PER_PIPE = 90; // ~1500ms at 60fps

// ─── In-memory state (persists across warm starts) ──────────────
let cachedState = null;

// ─── Pure JS Neural Network ────────────────────────────────────
function leakyRelu(x, alpha) {
  return x >= 0 ? x : alpha * x;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function predict(weights, inputs) {
  const w1 = weights[0].values; // [24] row-major
  const b1 = weights[1].values; // [6]
  const w2 = weights[2].values; // [6]
  const b2 = weights[3].values; // [1]

  const hidden = new Array(HIDDEN_SIZE);
  for (let j = 0; j < HIDDEN_SIZE; j++) {
    let sum = b1[j];
    for (let i = 0; i < INPUT_SIZE; i++) {
      sum += inputs[i] * w1[i * HIDDEN_SIZE + j];
    }
    hidden[j] = leakyRelu(sum, 0.01);
  }

  let output = b2[0];
  for (let j = 0; j < HIDDEN_SIZE; j++) {
    output += hidden[j] * w2[j];
  }
  return sigmoid(output);
}

function cloneWeights(weights) {
  return weights.map((w) => ({
    shape: [...w.shape],
    values: [...w.values],
  }));
}

function mutateWeights(weights) {
  return weights.map((w) => ({
    shape: [...w.shape],
    values: w.values.map((v) =>
      Math.random() < MUTATION_RATE ? v + (Math.random() * 2 - 1) * 0.1 : v,
    ),
  }));
}

function randomWeights() {
  const rand = (n) => Array.from({ length: n }, () => Math.random() * 2 - 1);
  return [
    { shape: [4, 6], values: rand(24) },
    { shape: [6], values: rand(6) },
    { shape: [6, 1], values: rand(6) },
    { shape: [1], values: rand(1) },
  ];
}

// ─── Bird ──────────────────────────────────────────────────────
class Bird {
  constructor(weights) {
    this.x = 50;
    this.y = GAME_HEIGHT / 2;
    this.velocity = 0;
    this.weights = weights;
    this.fitness = 0;
    this.alive = true;
    this.score = 0;
  }

  think(pipes) {
    const nearest = pipes.find((p) => p.x + 52 >= this.x) || pipes[pipes.length - 1];
    if (!nearest) return false;
    const inputs = [
      (nearest.x - this.x) / GAME_WIDTH,
      this.y / GAME_HEIGHT,
      (this.y - nearest.height) / GAME_HEIGHT,
      (nearest.height + PIPE_GAP - this.y) / GAME_HEIGHT,
    ];
    return predict(this.weights, inputs) > 0.5;
  }

  update(pipes) {
    if (!this.alive) return;
    this.velocity += GRAVITY;
    this.y += this.velocity;

    if (this.y + 24 > GAME_HEIGHT - GROUND_HEIGHT || this.y < 0) {
      this.alive = false;
      return;
    }

    for (const pipe of pipes) {
      if (this.checkCollision(pipe)) {
        this.alive = false;
        return;
      }
    }

    this.fitness++;
    if (pipes.length > 0) {
      const pipe = pipes[0];
      if (!pipe.scored && pipe.x + 52 < this.x) {
        this.score++;
        pipe.scored = true;
      }
    }
  }

  checkCollision(pipe) {
    const bx = this.x + 5;
    const by = this.y + 5;
    const bw = 24;
    const bh = 14;
    if (bx < pipe.x + 52 && bx + bw > pipe.x && by < pipe.height) return true;
    if (bx < pipe.x + 52 && bx + bw > pipe.x && by + bh > pipe.height + PIPE_GAP) return true;
    return false;
  }
}

// ─── Evolution ─────────────────────────────────────────────────
function runEvolution(seedWeights) {
  const startGen = cachedState ? cachedState.generation + 1 : 1;
  const startTotal = cachedState ? cachedState.totalGenerations + 1 : 1;
  const startBest = cachedState ? cachedState.bestScore : 0;
  let weights = seedWeights ? cloneWeights(seedWeights) : randomWeights();
  let generation = startGen;
  let bestScore = startBest;
  let totalGenerations = startTotal;

  let birds = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    const b = new Bird(cloneWeights(weights));
    if (i > 0) b.weights = mutateWeights(cloneWeights(weights));
    birds.push(b);
  }

  for (let gen = 0; gen < GENERATIONS_PER_RUN; gen++) {
    let pipes = [];
    let pipeCounter = 0;
    let maxFrames = 60000;

    while (birds.some((b) => b.alive) && maxFrames-- > 0) {
      if (pipeCounter <= 0) {
        if (pipes.length === 0 || pipes[pipes.length - 1].x < GAME_WIDTH - PIPE_HORIZONTAL_GAP) {
          const minH = 60;
          const maxH = GAME_HEIGHT - PIPE_GAP - 80 - GROUND_HEIGHT;
          const height = minH + Math.random() * (maxH - minH);
          pipes.push({ x: GAME_WIDTH, height: Math.floor(height), gap: PIPE_GAP, scored: false });
        }
        pipeCounter = FRAMES_PER_PIPE;
      }
      pipeCounter--;

      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        if (pipes[i].x + 52 < 0) pipes.splice(i, 1);
      }

      for (const bird of birds) {
        if (bird.alive) {
          if (bird.think(pipes)) bird.velocity = FLAP_SPEED;
          bird.update(pipes);
        }
      }
    }

    birds.sort((a, b) => b.fitness - a.fitness);

    if (birds[0].score > bestScore) {
      bestScore = birds[0].score;
      weights = cloneWeights(birds[0].weights);
    }

    const parents = birds.slice(0, Math.floor(POPULATION_SIZE / 2));
    const nextGen = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const parent = parents[Math.floor(Math.random() * parents.length)];
      const child = new Bird(cloneWeights(parent.weights));
      child.weights = mutateWeights(child.weights);
      nextGen.push(child);
    }
    birds = nextGen;
    generation++;
    totalGenerations++;
  }

  return { weights, generation, bestScore, totalGenerations };
}

// ─── Load brain from file (tries disk first, falls back to cache) ─
function loadBrainFromFile() {
  try {
    if (fs.existsSync(BRAIN_FILE)) {
      const data = JSON.parse(fs.readFileSync(BRAIN_FILE, 'utf8'));
      if (data && data.weights && data.weights.length === 4) {
        return data;
      }
    }
  } catch (e) {
    // File not readable (cold start on Vercel, expected)
  }
  return null;
}

// ─── Handler ───────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // On cold start, hydrate cache from the shared file (deployed with project)
  if (!cachedState) {
    const fileState = loadBrainFromFile();
    if (fileState) {
      cachedState = fileState;
    }
  }

  const isStatsOnly = req.query && req.query.stats === '1';

  // Stats-only request: return cached/file state instantly
  if (isStatsOnly) {
    if (cachedState) {
      return res.status(200).json({
        generation: cachedState.generation,
        bestScore: cachedState.bestScore,
        totalGenerations: cachedState.totalGenerations,
        weights: cachedState.weights,
        lastActive: cachedState.lastActive || null,
      });
    }
    // Nothing at all (first deploy, CI hasn't run yet)
    return res.status(200).json({
      generation: 0,
      bestScore: 0,
      totalGenerations: 0,
      weights: null,
      lastActive: null,
    });
  }

  // Evolution request: run evolution and update cache
  try {
    const seedWeights = cachedState ? cachedState.weights : null;
    const result = runEvolution(seedWeights);

    cachedState = {
      weights: result.weights,
      generation: result.generation,
      bestScore: result.bestScore,
      totalGenerations: result.totalGenerations,
      lastActive: Date.now(),
    };

    // Also try to persist to file as cold-start fallback
    try {
      fs.writeFileSync(BRAIN_FILE, JSON.stringify(cachedState, null, 2));
    } catch {}

    res.status(200).json({
      generation: cachedState.generation,
      bestScore: cachedState.bestScore,
      totalGenerations: cachedState.totalGenerations,
      weights: cachedState.weights,
      message: `Evolved ${GENERATIONS_PER_RUN} generations. Best score: ${cachedState.bestScore}`,
    });
  } catch (err) {
    console.error('Evolution error:', err);
    res.status(500).json({ error: 'Evolution failed', message: err.message });
  }
};

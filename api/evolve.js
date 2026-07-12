// ─── Server-side NEAT Flappy Bird Evolution ─────────────────────
// Runs headlessly in a Vercel serverless function.
// Uses pure JavaScript (no TF.js) for speed and low memory.
// Stores brain state in Vercel Blob.
//
// Requires env: BLOB_READ_WRITE_TOKEN

const { put, head } = require('@vercel/blob');

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
const BLOB_NAME = 'vortex-state.json';

// ─── Pure JS Neural Network ────────────────────────────────────

function leakyRelu(x, alpha) {
  return x >= 0 ? x : alpha * x;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// Predict: forward pass through the network.
// weights format matches TF.js serialized weights:
//   [{shape:[4,6],values}, {shape:[6],values}, {shape:[6,1],values}, {shape:[1],values}]
function predict(weights, inputs) {
  const w1 = weights[0].values; // [24] row-major: 4 rows × 6 cols
  const b1 = weights[1].values; // [6]
  const w2 = weights[2].values; // [6]
  const b2 = weights[3].values; // [1]

  // Hidden layer: LeakyReLU(W1 · input + b1)
  const hidden = new Array(HIDDEN_SIZE);
  for (let j = 0; j < HIDDEN_SIZE; j++) {
    let sum = b1[j];
    for (let i = 0; i < INPUT_SIZE; i++) {
      sum += inputs[i] * w1[i * HIDDEN_SIZE + j];
    }
    hidden[j] = leakyRelu(sum, 0.01);
  }

  // Output layer: sigmoid(W2 · hidden + b2)
  let output = b2[0];
  for (let j = 0; j < HIDDEN_SIZE; j++) {
    output += hidden[j] * w2[j];
  }
  return sigmoid(output);
}

// ─── Weight Helpers ────────────────────────────────────────────

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
      Math.random() < MUTATION_RATE
        ? v + (Math.random() * 2 - 1) * 0.1
        : v,
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

// ─── Evolution Run ─────────────────────────────────────────────

function runEvolution(savedState) {
  let { weights, generation, bestScore, totalGenerations } = savedState;

  // Create initial population
  let birds = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    const b = new Bird(cloneWeights(weights));
    if (i > 0) b.weights = mutateWeights(cloneWeights(weights));
    birds.push(b);
  }

  for (let gen = 0; gen < GENERATIONS_PER_RUN; gen++) {
    let pipes = [];
    let pipeCounter = 0;
    let maxFrames = 60000; // safety: max 60k frames per gen

    while (birds.some((b) => b.alive) && maxFrames-- > 0) {
      // Spawn pipes on frame counter
      if (pipeCounter <= 0) {
        if (
          pipes.length === 0 ||
          pipes[pipes.length - 1].x < GAME_WIDTH - PIPE_HORIZONTAL_GAP
        ) {
          const minH = 60;
          const maxH = GAME_HEIGHT - PIPE_GAP - 80 - GROUND_HEIGHT;
          const height = minH + Math.random() * (maxH - minH);
          pipes.push({
            x: GAME_WIDTH,
            height: Math.floor(height),
            gap: PIPE_GAP,
            scored: false,
          });
        }
        pipeCounter = FRAMES_PER_PIPE;
      }
      pipeCounter--;

      // Move pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        if (pipes[i].x + 52 < 0) pipes.splice(i, 1);
      }

      // Update each bird
      for (const bird of birds) {
        if (bird.alive) {
          if (bird.think(pipes)) bird.velocity = FLAP_SPEED;
          bird.update(pipes);
        }
      }
    }

    // Selection: sort by fitness descending
    birds.sort((a, b) => b.fitness - a.fitness);

    // Update best score
    if (birds[0].score > bestScore) {
      bestScore = birds[0].score;
      weights = cloneWeights(birds[0].weights);
    }

    // Create next generation from top half
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

// ─── Blob Storage ──────────────────────────────────────────────

async function loadState() {
  try {
    const blob = await head(BLOB_NAME);
    if (!blob || !blob.url) return null;
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function saveState(state) {
  try {
    await put(BLOB_NAME, JSON.stringify(state), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
  } catch (err) {
    console.error('Failed to save state to Blob:', err);
  }
}

// ─── Handler ───────────────────────────────────────────────────

module.exports = async (req, res) => {
  // CORS headers for client-side fetch
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Load current state from Blob
    let state = await loadState();

    // First ever run — create fresh random brain
    if (!state || !state.weights) {
      state = {
        weights: randomWeights(),
        generation: 1,
        bestScore: 0,
        totalGenerations: 1,
        lastActive: Date.now(),
      };
      await saveState(state);
    }

    // Run evolution
    const result = runEvolution(state);

    // Prepare new state
    const newState = {
      weights: result.weights,
      generation: result.generation,
      bestScore: result.bestScore,
      totalGenerations: result.totalGenerations,
      lastActive: Date.now(),
    };

    // Save to Blob
    await saveState(newState);

    // Return stats (without full weights to keep response small)
    res.status(200).json({
      generation: newState.generation,
      bestScore: newState.bestScore,
      totalGenerations: newState.totalGenerations,
      lastActive: newState.lastActive,
      message: `Evolved ${GENERATIONS_PER_RUN} generations`,
    });
  } catch (err) {
    console.error('Evolution error:', err);
    res.status(500).json({
      error: 'Evolution failed',
      message: err.message,
    });
  }
};

// ─── Standalone NEAT Evolution Runner ──────────────────────────
// Run by GitLab CI every 10 minutes.
// Reads latest-brain.json, runs 400 generations, writes back.
// Pure Node.js — zero dependencies.

const fs = require('fs');
const path = require('path');

const BRAIN_FILE = path.join(__dirname, '..', 'latest-brain.json');

// ─── NEAT Config (matching vortex-flappy.js) ──────────────────
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

// ─── Pure JS Neural Network ────────────────────────────────────
function leakyRelu(x, alpha) { return x >= 0 ? x : alpha * x; }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function predict(weights, inputs) {
  const w1 = weights[0].values;
  const b1 = weights[1].values;
  const w2 = weights[2].values;
  const b2 = weights[3].values;

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
  return weights.map(w => ({ shape: [...w.shape], values: [...w.values] }));
}

function mutateWeights(weights) {
  return weights.map(w => ({
    shape: [...w.shape],
    values: w.values.map(v =>
      Math.random() < MUTATION_RATE ? v + (Math.random() * 2 - 1) * 0.1 : v
    ),
  }));
}

function randomWeights() {
  const rand = n => Array.from({ length: n }, () => Math.random() * 2 - 1);
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
    const nearest = pipes.find(p => p.x + 52 >= this.x) || pipes[pipes.length - 1];
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
    if (this.y + 24 > GAME_HEIGHT - GROUND_HEIGHT || this.y < 0) { this.alive = false; return; }
    for (const pipe of pipes) {
      if (this.checkCollision(pipe)) { this.alive = false; return; }
    }
    this.fitness++;
    if (pipes.length > 0) {
      const pipe = pipes[0];
      if (!pipe.scored && pipe.x + 52 < this.x) { this.score++; pipe.scored = true; }
    }
  }

  checkCollision(pipe) {
    const bx = this.x + 5, by = this.y + 5, bw = 24, bh = 14;
    if (bx < pipe.x + 52 && bx + bw > pipe.x && by < pipe.height) return true;
    if (bx < pipe.x + 52 && bx + bw > pipe.x && by + bh > pipe.height + PIPE_GAP) return true;
    return false;
  }
}

// ─── Evolution ─────────────────────────────────────────────────
function runEvolution(seedWeights, startGen, startBest, startTotal, gens) {
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

  for (let gen = 0; gen < gens; gen++) {
    let pipes = [];
    let pipeCounter = 0;
    let maxFrames = 60000;

    while (birds.some(b => b.alive) && maxFrames-- > 0) {
      if (pipeCounter <= 0) {
        if (pipes.length === 0 || pipes[pipes.length - 1].x < GAME_WIDTH - PIPE_HORIZONTAL_GAP) {
          const minH = 60, maxH = GAME_HEIGHT - PIPE_GAP - 80 - GROUND_HEIGHT;
          pipes.push({ x: GAME_WIDTH, height: Math.floor(minH + Math.random() * (maxH - minH)), gap: PIPE_GAP, scored: false });
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

// ─── Main ──────────────────────────────────────────────────────
function main() {
  let seedWeights = null;
  let gen = 1, total = 1, best = 0;

  // Try to load existing brain
  try {
    if (fs.existsSync(BRAIN_FILE)) {
      const data = JSON.parse(fs.readFileSync(BRAIN_FILE, 'utf8'));
      if (data.weights && data.weights.length === 4) {
        seedWeights = data.weights;
        gen = (data.generation || 0) + 1;
        total = (data.totalGenerations || 0) + 1;
        best = data.bestScore || 0;
        console.log(`Loaded brain: generation ${gen - 1}, best score ${best}`);
      }
    }
  } catch (e) {
    console.log('No existing brain found, starting fresh');
  }

  const result = runEvolution(seedWeights, gen, best, total, GENERATIONS_PER_RUN);

  const output = {
    weights: result.weights,
    generation: result.generation,
    bestScore: result.bestScore,
    totalGenerations: result.totalGenerations,
    updatedAt: Date.now(),
  };

  fs.writeFileSync(BRAIN_FILE, JSON.stringify(output, null, 2));
  console.log(`Evolved ${GENERATIONS_PER_RUN} generations. Now: gen ${output.generation}, best score ${output.bestScore}, total gens ${output.totalGenerations}`);
}

main();

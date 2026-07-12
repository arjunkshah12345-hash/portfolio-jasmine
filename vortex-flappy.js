// ─── Config ────────────────────────────────────────────────────
const POPULATION_SIZE = 50;
const INPUT_NODES = 4;
const OUTPUT_NODES = 1;
const MUTATION_RATE = 0.1;
const GRAVITY = 0.9;
const FLAP_SPEED = -14;
const GROUND_HEIGHT = 112;
const PIPE_SPEED = 4;
const PIPE_SPAWN_INTERVAL = 1500;
const PIPE_GAP = 150;
const PIPE_HORIZONTAL_GAP = 220;

// ─── NeatBird Class ────────────────────────────────────────────
class NeatBird {
    constructor(gameWidth, gameHeight, brain = null) {
        this.x = 50;
        this.y = gameHeight / 2;
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.brain = brain || this.createBrain();
        this.fitness = 0;
        this.alive = true;
        this.score = 0;
        this.gameHeight = gameHeight;
        this.gameWidth = gameWidth;
    }

    createBrain() {
        const model = tf.sequential();
        model.add(tf.layers.dense({
            inputShape: [INPUT_NODES],
            units: 6
        }));
        model.add(tf.layers.leakyReLU());
        model.add(tf.layers.dense({
            units: OUTPUT_NODES,
            activation: 'sigmoid'
        }));
        return model;
    }

    think(inputs) {
        return tf.tidy(() => {
            const inputTensor = tf.tensor2d([inputs]);
            const output = this.brain.predict(inputTensor);
            return output.dataSync()[0] > 0.5;
        });
    }

    update(pipes) {
        if (!this.alive) return;

        this.velocity += GRAVITY;
        this.y += this.velocity;

        if (this.y + this.height > this.gameHeight - GROUND_HEIGHT) {
            this.y = this.gameHeight - GROUND_HEIGHT - this.height;
            this.alive = false;
            return;
        }

        if (this.y < 0) {
            this.y = 0;
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
        const birdBox = {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
        if (birdBox.x < pipe.x + 52 && birdBox.x + birdBox.width > pipe.x &&
            birdBox.y < pipe.height) return true;
        if (birdBox.x < pipe.x + 52 && birdBox.x + birdBox.width > pipe.x &&
            birdBox.y + birdBox.height > pipe.height + pipe.gap) return true;
        return false;
    }

    mutate() {
        tf.tidy(() => {
            const weights = this.brain.getWeights();
            const mutatedWeights = weights.map(w => {
                const shape = w.shape;
                const values = w.dataSync().map(v => {
                    if (Math.random() < MUTATION_RATE) {
                        return v + (Math.random() * 2 - 1) * 0.1;
                    }
                    return v;
                });
                return tf.tensor(values, shape);
            });
            this.brain.setWeights(mutatedWeights);
        });
    }
}

// ─── Brain persistence helpers ────────────────────────────────
function saveBestBrain(brain) {
    try {
        const weights = brain.getWeights();
        const data = weights.map(w => ({
            shape: w.shape,
            values: Array.from(w.dataSync())
        }));
        localStorage.setItem('vortex-brain', JSON.stringify(data));
    } catch (e) { /* localStorage full or unavailable */ }
}

function loadBestBrain() {
    try {
        const saved = localStorage.getItem('vortex-brain');
        if (!saved) return null;
        const data = JSON.parse(saved);
        const model = tf.sequential();
        model.add(tf.layers.dense({ inputShape: [INPUT_NODES], units: 6 }));
        model.add(tf.layers.leakyReLU());
        model.add(tf.layers.dense({ units: OUTPUT_NODES, activation: 'sigmoid' }));
        const tensors = data.map(d => tf.tensor(d.values, d.shape));
        model.setWeights(tensors);
        return model;
    } catch (e) {
        return null;
    }
}

// ─── Population Class ──────────────────────────────────────────
class VortexPopulation {
    constructor(gameWidth, gameHeight, generation = 1, bestScore = 0, seedBrain = null) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.birds = [];
        if (seedBrain) {
            // Seed all birds from the saved brain so learning continues
            for (let i = 0; i < POPULATION_SIZE; i++) {
                const bird = new NeatBird(gameWidth, gameHeight);
                tf.tidy(() => {
                    const weights = seedBrain.getWeights();
                    const cloned = weights.map(w => tf.clone(w));
                    bird.brain.setWeights(cloned);
                });
                bird.mutate();
                this.birds.push(bird);
            }
            seedBrain.dispose();
        } else {
            for (let i = 0; i < POPULATION_SIZE; i++) {
                this.birds.push(new NeatBird(gameWidth, gameHeight));
            }
        }
        this.generation = generation;
        this.bestScore = bestScore;
        this.bestBird = null;
        this.totalGenerations = generation;
    }

    update(pipes) {
        let allDead = true;
        this.birds.forEach(bird => {
            if (bird.alive) {
                allDead = false;
                bird.update(pipes);
                const inputs = this.getInputs(bird, pipes);
                if (bird.think(inputs)) {
                    bird.velocity = FLAP_SPEED;
                }
            }
        });

        if (allDead) {
            this.nextGeneration();
            return true;
        }
        return false;
    }

    getInputs(bird, pipes) {
        const nearestPipe = this.getNearestPipe(bird, pipes);
        if (!nearestPipe) return [0, bird.y / this.gameHeight, 0, 0];
        return [
            (nearestPipe.x - bird.x) / this.gameWidth,
            bird.y / this.gameHeight,
            (bird.y - nearestPipe.height) / this.gameHeight,
            (nearestPipe.height + nearestPipe.gap - bird.y) / this.gameHeight
        ];
    }

    getNearestPipe(bird, pipes) {
        return pipes.find(pipe => pipe.x + 52 >= bird.x) || null;
    }

    nextGeneration() {
        const bestBirds = this.birds
            .sort((a, b) => b.fitness - a.fitness)
            .slice(0, POPULATION_SIZE / 2);

        if (bestBirds[0].score > this.bestScore) {
            this.bestScore = bestBirds[0].score;
            this.bestBird = bestBirds[0];
            // Persist the actual neural network weights
            saveBestBrain(bestBirds[0].brain);
        }

        this.birds = [];
        for (let i = 0; i < POPULATION_SIZE; i++) {
            const parent = bestBirds[Math.floor(Math.random() * bestBirds.length)];
            const child = new NeatBird(this.gameWidth, this.gameHeight);
            tf.tidy(() => {
                const parentWeights = parent.brain.getWeights();
                const clonedWeights = parentWeights.map(w => tf.clone(w));
                child.brain.setWeights(clonedWeights);
            });
            child.mutate();
            this.birds.push(child);
        }

        this.generation++;
        this.totalGenerations++;
        // Persist progress and last-active timestamp
        try {
            localStorage.setItem('vortex-generation', this.generation);
            localStorage.setItem('vortex-bestScore', this.bestScore);
            localStorage.setItem('vortex-totalGens', this.totalGenerations);
            localStorage.setItem('vortex-lastActive', Date.now());
        } catch {}
    }

    draw(ctx, sprites, birdFrames, currentFrame) {
        this.birds.forEach(bird => {
            if (bird.alive) {
                ctx.save();
                ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
                ctx.rotate(Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5));
                const frame = birdFrames[currentFrame];
                ctx.drawImage(sprites, frame.x, frame.y, 17, 12,
                    -bird.width / 2, -bird.height / 2, bird.width, bird.height);
                ctx.restore();
            }
        });
    }
}

// ─── Bird frame positions ─────────────────────────────────────
const birdFrames = [
    { x: 3, y: 491 },
    { x: 31, y: 491 },
    { x: 59, y: 491 },
    { x: 31, y: 491 }
];

// ─── Helpers ───────────────────────────────────────────────────
// Fetch server-trained brain from the Vercel evolution API
async function fetchServerBrain() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/stats', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.weights || !data.bestScore) return null;
        return data;
    } catch {
        return null;
    }
}

// ─── Init Function ─────────────────────────────────────────────
async function initVortexFlappy(containerId, statsCallback) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = '';
    container.style.cssText = 'display:flex;justify-content:center;';

    // Single game canvas — just the bird and the pipes
    const gameCanvas = document.createElement('canvas');
    gameCanvas.width = 320;
    gameCanvas.height = 480;
    gameCanvas.style.cssText = 'border:1px solid rgba(255,255,255,0.15);border-radius:6px;display:block;';
    const ctx = gameCanvas.getContext('2d');
    container.appendChild(gameCanvas);

    // Load sprites
    const sprites = new Image();
    sprites.src = '/vortex-sprites.png';

    // Game state
    let pipes = [];
    let score = 0;
    let frameCount = 0;
    let currentFrame = 0;
    let bgX = 0;
    let groundX = 0;
    let running = true;

    // Restore persisted stats and brain from localStorage
    let savedGen = 1;
    let savedTotalGens = 1;
    let savedBest = 0;
    let savedBrain = null;
    let savedLastActive = null;
    try {
        savedGen = parseInt(localStorage.getItem('vortex-generation')) || 1;
        savedTotalGens = parseInt(localStorage.getItem('vortex-totalGens')) || 1;
        savedBest = parseInt(localStorage.getItem('vortex-bestScore')) || 0;
        savedBrain = loadBestBrain();
        savedLastActive = parseInt(localStorage.getItem('vortex-lastActive'));
    } catch {}

    // Fetch server-trained brain (trained 24/7 via Vercel function)
    // Override local state if server has a better brain
    try {
        const server = await fetchServerBrain();
        if (server && server.weights && server.bestScore > savedBest) {
            // Save server brain to localStorage for persistence
            localStorage.setItem('vortex-brain', JSON.stringify(server.weights));
            localStorage.setItem('vortex-generation', server.generation);
            localStorage.setItem('vortex-bestScore', server.bestScore);
            localStorage.setItem('vortex-totalGens', server.totalGenerations);
            savedBest = server.bestScore;
            savedGen = server.generation;
            savedTotalGens = server.totalGenerations;
            savedBrain = loadBestBrain(); // converts server weights to TF model
        }
    } catch {}

    // Fast-forward generations based on time elapsed since last active
    // The game runs ~180 generations per hour (~20s per gen)
    if (savedLastActive) {
        const elapsedMs = Date.now() - savedLastActive;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        if (elapsedHours > 1) {
            const ffGens = Math.floor(elapsedHours * 180);
            if (ffGens > 0) {
                savedGen += ffGens;
                savedTotalGens += ffGens;
            }
        }
    }

    // Save updated counters immediately
    try {
        localStorage.setItem('vortex-generation', savedGen);
        localStorage.setItem('vortex-totalGens', savedTotalGens);
        localStorage.setItem('vortex-bestScore', savedBest);
    } catch {}
    // Update lastActive to now
    try {
        localStorage.setItem('vortex-lastActive', Date.now());
    } catch {}

    // Birth timestamp — set once, runs forever
    let birthTimestamp;
    try {
        birthTimestamp = parseInt(localStorage.getItem('vortex-birth'));
        if (!birthTimestamp) {
            birthTimestamp = Date.now();
            localStorage.setItem('vortex-birth', birthTimestamp);
        }
    } catch {
        birthTimestamp = Date.now();
    }

    let population = new VortexPopulation(gameCanvas.width, gameCanvas.height, savedGen, savedBest, savedBrain);

    // Pipe spawning
    let pipeInterval = null;
    function spawnPipe() {
        if (!running) return;
        if (pipes.length > 0) {
            const lastPipe = pipes[pipes.length - 1];
            if (lastPipe.x > gameCanvas.width - PIPE_HORIZONTAL_GAP) return;
        }
        const minHeight = 60;
        const maxHeight = gameCanvas.height - PIPE_GAP - 80 - GROUND_HEIGHT;
        let height;
        const randomFactor = Math.random();
        if (randomFactor < 0.4) {
            height = randomFactor < 0.2 ? minHeight + Math.random() * 40 : maxHeight - Math.random() * 40;
        } else {
            height = minHeight + Math.random() * (maxHeight - minHeight);
        }
        pipes.push({ x: gameCanvas.width, height: Math.floor(height), gap: PIPE_GAP, scored: false });
    }

    // Drawing functions
    function drawGame() {
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

        for (const pipe of pipes) {
            ctx.drawImage(sprites, 84, 323, 26, 160, pipe.x, pipe.height + pipe.gap, 52, 400);
        }
        for (const pipe of pipes) {
            ctx.drawImage(sprites, 56, 323, 26, 160, pipe.x, pipe.height - 400, 52, 400);
        }
        for (let i = 0; i < 3; i++) {
            ctx.drawImage(sprites, 292, 0, 168, 56, groundX + (i * 224), gameCanvas.height - GROUND_HEIGHT, 224, 112);
        }

        population.draw(ctx, sprites, birdFrames, currentFrame);

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(score, gameCanvas.width / 2, 50);
        ctx.fillText(score, gameCanvas.width / 2, 50);
    }

    // Game loop
    function updatePipes() {
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= PIPE_SPEED;
            if (pipes[i].x + 52 < 0) { pipes.splice(i, 1); }
        }
    }

    function gameLoop() {
        if (!running) return;

        // Background scroll
        groundX -= PIPE_SPEED;
        if (groundX <= -224) groundX = 0;

        // Update population
        if (population.update(pipes)) {
            pipes = [];
            score = 0;
            spawnPipe();
        }

        updatePipes();

        // Update score
        const aliveBirds = population.birds.filter(b => b.alive);
        if (aliveBirds.length > 0) {
            score = Math.max(...aliveBirds.map(b => b.score));
        }

        // Bird animation
        if (frameCount % 5 === 0) {
            currentFrame = (currentFrame + 1) % birdFrames.length;
        }
        frameCount++;

        // Draw game
        drawGame();

        // Calculate elapsed time since birth
        const elapsed = Date.now() - birthTimestamp;
        const totalSeconds = Math.floor(elapsed / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        // Report stats to React
        if (statsCallback) {
            statsCallback({
                generation: population.generation,
                bestScore: population.bestScore,
                aliveCount: population.birds.filter(b => b.alive).length,
                totalGenerations: population.totalGenerations,
                elapsedDays: days,
                elapsedHours: hours,
                elapsedMinutes: minutes
            });
        }

        requestAnimationFrame(gameLoop);
    }

    // Start
    sprites.onload = () => {
        pipeInterval = setInterval(spawnPipe, PIPE_SPAWN_INTERVAL);
        spawnPipe();
        gameLoop();
    };

    // If sprites already loaded
    if (sprites.complete) {
        pipeInterval = setInterval(spawnPipe, PIPE_SPAWN_INTERVAL);
        spawnPipe();
        gameLoop();
    }

    // Return cleanup
    return {
        destroy: () => {
            running = false;
            if (pipeInterval) clearInterval(pipeInterval);
            container.innerHTML = '';
            // Dispose TensorFlow tensors
            try {
                population.birds.forEach(b => {
                    if (b.brain) b.brain.dispose();
                });
            } catch {}
        }
    };
}

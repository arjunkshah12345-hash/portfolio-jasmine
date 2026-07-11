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

// ─── Population Class ──────────────────────────────────────────
class VortexPopulation {
    constructor(gameWidth, gameHeight, generation = 1, bestScore = 0) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.birds = Array(POPULATION_SIZE).fill().map(() =>
            new NeatBird(gameWidth, gameHeight));
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
        // Persist progress
        try {
            localStorage.setItem('vortex-generation', this.generation);
            localStorage.setItem('vortex-bestScore', this.bestScore);
            localStorage.setItem('vortex-totalGens', this.totalGenerations);
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

// ─── Init Function ─────────────────────────────────────────────
function initVortexFlappy(containerId, statsCallback) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = '';
    container.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;';

    // Create canvases
    const networkCanvas = document.createElement('canvas');
    networkCanvas.width = 520;
    networkCanvas.height = 160;
    networkCanvas.style.cssText = 'border:1px solid #333;border-radius:4px;';
    const networkCtx = networkCanvas.getContext('2d');

    const populationCanvas = document.createElement('canvas');
    populationCanvas.width = 200;
    populationCanvas.height = 360;
    populationCanvas.style.cssText = 'border:1px solid #333;border-radius:4px;';
    const populationCtx = populationCanvas.getContext('2d');

    const gameCanvas = document.createElement('canvas');
    gameCanvas.width = 320;
    gameCanvas.height = 480;
    gameCanvas.style.cssText = 'border:1px solid #333;border-radius:4px;';
    const ctx = gameCanvas.getContext('2d');

    const statsCanvas = document.createElement('canvas');
    statsCanvas.width = 200;
    statsCanvas.height = 360;
    statsCanvas.style.cssText = 'border:1px solid #333;border-radius:4px;';
    const statsCtx = statsCanvas.getContext('2d');

    // Row 1: network
    const row1 = document.createElement('div');
    row1.style.cssText = 'width:100%;display:flex;justify-content:center;';
    row1.appendChild(networkCanvas);
    container.appendChild(row1);

    // Row 2: population, game, stats
    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;';
    row2.appendChild(populationCanvas);
    row2.appendChild(gameCanvas);
    row2.appendChild(statsCanvas);
    container.appendChild(row2);

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

    // Restore persisted stats
    let savedGen = 1;
    let savedBest = 0;
    try {
        savedGen = parseInt(localStorage.getItem('vortex-generation')) || 1;
        savedBest = parseInt(localStorage.getItem('vortex-bestScore')) || 0;
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

    let population = new VortexPopulation(gameCanvas.width, gameCanvas.height, savedGen, savedBest);

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

    function drawNetwork() {
        networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
        networkCtx.fillStyle = '#fff';
        networkCtx.fillRect(0, 0, networkCanvas.width, networkCanvas.height);

        const bestBird = population.birds.find(b => b.alive) || population.bestBird;
        if (!bestBird) return;

        const layers = [INPUT_NODES, 6, OUTPUT_NODES];
        const layerSpacing = networkCanvas.width / (layers.length + 1);
        const nodeSpacing = networkCanvas.height / (Math.max(...layers) + 1);

        const weights = bestBird.brain.getWeights();
        for (let i = 0; i < layers.length - 1; i++) {
            const layerWeights = weights[i * 2].arraySync();
            for (let j = 0; j < layers[i]; j++) {
                for (let k = 0; k < layers[i + 1]; k++) {
                    const w = layerWeights[j][k];
                    const x1 = layerSpacing * (i + 1);
                    const y1 = nodeSpacing * (j + 1);
                    const x2 = layerSpacing * (i + 2);
                    const y2 = nodeSpacing * (k + 1);
                    networkCtx.beginPath();
                    networkCtx.strokeStyle = w > 0 ? 'rgba(0,255,0,' + Math.abs(w) + ')' : 'rgba(255,0,0,' + Math.abs(w) + ')';
                    networkCtx.lineWidth = Math.abs(w) * 2;
                    networkCtx.moveTo(x1, y1);
                    networkCtx.lineTo(x2, y2);
                    networkCtx.stroke();
                }
            }
        }

        layers.forEach((nodeCount, layerIndex) => {
            for (let i = 0; i < nodeCount; i++) {
                const x = layerSpacing * (layerIndex + 1);
                const y = nodeSpacing * (i + 1);
                networkCtx.beginPath();
                networkCtx.arc(x, y, 10, 0, Math.PI * 2);
                networkCtx.fillStyle = '#70c5ce';
                networkCtx.fill();
                networkCtx.strokeStyle = '#000';
                networkCtx.lineWidth = 1;
                networkCtx.stroke();
                networkCtx.fillStyle = '#000';
                networkCtx.font = '10px monospace';
                networkCtx.textAlign = 'center';
                if (layerIndex === 0) {
                    const labels = ['Dist', 'Y-pos', 'Top', 'Bottom'];
                    networkCtx.fillText(labels[i], x, y + 22);
                } else if (layerIndex === layers.length - 1) {
                    networkCtx.fillText('Flap', x, y + 22);
                }
            }
        });
    }

    function drawPopulationStats() {
        populationCtx.clearRect(0, 0, populationCanvas.width, populationCanvas.height);
        populationCtx.fillStyle = '#1a1a18';
        populationCtx.fillRect(0, 0, populationCanvas.width, populationCanvas.height);
        populationCtx.fillStyle = '#e8e5dd';
        populationCtx.font = '13px monospace';
        populationCtx.textAlign = 'left';

        const items = [
            'Generation: ' + population.generation,
            'Alive: ' + population.birds.filter(b => b.alive).length,
            'Best Score: ' + population.bestScore,
            'Score: ' + score,
            'Total Gens: ' + population.totalGenerations
        ];

        let y = 30;
        items.forEach(item => {
            populationCtx.fillText(item, 15, y);
            y += 28;
        });
    }

    function drawStats() {
        statsCtx.clearRect(0, 0, statsCanvas.width, statsCanvas.height);
        statsCtx.fillStyle = '#1a1a18';
        statsCtx.fillRect(0, 0, statsCanvas.width, statsCanvas.height);
        statsCtx.fillStyle = '#e8e5dd';
        statsCtx.font = '12px monospace';
        statsCtx.textAlign = 'left';

        let nearestPipe = null;
        let minDistance = Infinity;
        for (const pipe of pipes) {
            if (pipe.x + 52 >= 50) {
                const d = pipe.x - 50;
                if (d < minDistance) { minDistance = d; nearestPipe = pipe; }
            }
        }

        const alive = population.birds.find(b => b.alive);
        const yPos = alive ? alive.y : 0;
        const items = [
            'Dist to pipe: ' + (nearestPipe ? Math.max(0, Math.floor(minDistance)) + 'px' : 'N/A'),
            'Bird Y: ' + Math.floor(yPos) + 'px',
            'Top gap: ' + (nearestPipe ? Math.floor(yPos - nearestPipe.height) + 'px' : 'N/A'),
            'Bot gap: ' + (nearestPipe ? Math.floor(nearestPipe.height + nearestPipe.gap - yPos - 24) + 'px' : 'N/A')
        ];

        let y = 30;
        items.forEach(item => {
            statsCtx.fillText(item, 15, y);
            y += 28;
        });
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

        // Draw everything
        drawGame();
        drawNetwork();
        drawPopulationStats();
        drawStats();

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

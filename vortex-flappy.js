// ─── Config ────────────────────────────────────────────────────
const GRAVITY = 0.9;
const FLAP_SPEED = -14;
const GROUND_HEIGHT = 112;
const PIPE_SPEED = 4;
const PIPE_SPAWN_INTERVAL = 1500;
const PIPE_GAP = 150;
const PIPE_HORIZONTAL_GAP = 220;

// ─── Bird Class ────────────────────────────────────────────────
class FlappyBird {
    constructor(gameWidth, gameHeight, brain) {
        this.x = 50;
        this.y = gameHeight / 2;
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.brain = brain;
        this.alive = true;
        this.gameHeight = gameHeight;
        this.gameWidth = gameWidth;
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
        if (this.y + this.height > this.gameHeight - GROUND_HEIGHT || this.y < 0) {
            this.alive = false;
        }
        for (const pipe of pipes) {
            if (this.checkCollision(pipe)) {
                this.alive = false;
            }
        }
    }

    checkCollision(pipe) {
        const bx = this.x + 5;
        const by = this.y + 5;
        const bw = this.width - 10;
        const bh = this.height - 10;
        if (bx < pipe.x + 52 && bx + bw > pipe.x && by < pipe.height) return true;
        if (bx < pipe.x + 52 && bx + bw > pipe.x && by + bh > pipe.height + pipe.gap) return true;
        return false;
    }
}

// ─── Brain persistence helpers ─────────────────────────────────
function loadBestBrain() {
    try {
        const saved = localStorage.getItem('vortex-brain');
        if (!saved) return null;
        const data = JSON.parse(saved);
        const model = tf.sequential();
        model.add(tf.layers.dense({ inputShape: [4], units: 6 }));
        model.add(tf.layers.leakyReLU());
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
        const tensors = data.map(d => tf.tensor(d.values, d.shape));
        model.setWeights(tensors);
        return model;
    } catch (e) {
        return null;
    }
}

// ─── Fetch the shared brain file from CDN (same for ALL visitors) ──
async function fetchLatestBrain() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/latest-brain.json', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.weights || !data.bestScore) return null;
        return data;
    } catch {
        return null;
    }
}

// ─── Bird frame positions ─────────────────────────────────────
const birdFrames = [
    { x: 3, y: 491 },
    { x: 31, y: 491 },
    { x: 59, y: 491 },
    { x: 31, y: 491 }
];

// ─── Init Function (Spectator Mode — single bird, no evolution) ──
async function initVortexFlappy(containerId, statsCallback) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = '';
    container.style.cssText = 'display:flex;justify-content:center;';

    // Single game canvas
    const gameCanvas = document.createElement('canvas');
    gameCanvas.width = 320;
    gameCanvas.height = 480;
    gameCanvas.style.cssText = 'border:1px solid rgba(255,255,255,0.15);border-radius:6px;display:block;';
    const ctx = gameCanvas.getContext('2d');
    container.appendChild(gameCanvas);

    // Load sprites
    const sprites = new Image();
    sprites.src = '/vortex-sprites.png';

    // ─── Load the best brain (source of truth: latest-brain.json) ──
    let brain = null;

    // Load persisted best score from localStorage (survives tab closes)
    let brainBestScore = parseInt(localStorage.getItem('vortex-bestScore')) || 0;

    try {
        const fileBrain = await fetchLatestBrain();
        if (fileBrain && fileBrain.weights && fileBrain.bestScore > 0) {
            localStorage.setItem('vortex-brain', JSON.stringify(fileBrain.weights));
            // Keep the higher of file brain score and what we've seen
            if (fileBrain.bestScore > brainBestScore) {
                brainBestScore = fileBrain.bestScore;
                localStorage.setItem('vortex-bestScore', brainBestScore);
            }
            brain = loadBestBrain();
        }
    } catch {}

    // Fallback to localStorage cache
    if (!brain) {
        brain = loadBestBrain();
    }

    // If still no brain, create a random one
    if (!brain) {
        const model = tf.sequential();
        model.add(tf.layers.dense({ inputShape: [4], units: 6 }));
        model.add(tf.layers.leakyReLU());
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
        brain = model;
    }

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

    // ─── Game State ───────────────────────────────────────────
    let bird = new FlappyBird(gameCanvas.width, gameCanvas.height, brain);
    let pipes = [];
    let roundScore = 0;
    // Load persisted high score so it survives tab closes
    let sessionHighScore = parseInt(localStorage.getItem('vortex-highScore')) || 0;
    if (sessionHighScore > brainBestScore) brainBestScore = sessionHighScore;
    let frameCount = 0;
    let currentFrame = 0;
    let groundX = 0;
    let running = true;
    let deadTimer = 0;
    const DEAD_DELAY = 30; // frames (~500ms) before restart

    // Pipe spawning
    function spawnPipe() {
        if (!running) return;
        if (pipes.length > 0 && pipes[pipes.length - 1].x > gameCanvas.width - PIPE_HORIZONTAL_GAP) return;
        const minHeight = 60;
        const maxHeight = gameCanvas.height - PIPE_GAP - 80 - GROUND_HEIGHT;
        const height = minHeight + Math.random() * (maxHeight - minHeight);
        pipes.push({ x: gameCanvas.width, height: Math.floor(height), gap: PIPE_GAP, scored: false });
    }

    // Reset the round — same brain, fresh game
    function resetRound() {
        bird = new FlappyBird(gameCanvas.width, gameCanvas.height, brain);
        pipes = [];
        roundScore = 0;
        deadTimer = 0;
        spawnPipe();
    }

    // ─── Drawing ──────────────────────────────────────────────
    function drawGame() {
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Pipes
        for (const pipe of pipes) {
            ctx.drawImage(sprites, 84, 323, 26, 160, pipe.x, pipe.height + pipe.gap, 52, 400);
        }
        for (const pipe of pipes) {
            ctx.drawImage(sprites, 56, 323, 26, 160, pipe.x, pipe.height - 400, 52, 400);
        }

        // Ground
        for (let i = 0; i < 3; i++) {
            ctx.drawImage(sprites, 292, 0, 168, 56, groundX + (i * 224), gameCanvas.height - GROUND_HEIGHT, 224, 112);
        }

        // Bird
        if (bird) {
            ctx.save();
            ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
            ctx.rotate(Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5));
            const frame = birdFrames[currentFrame];
            ctx.drawImage(sprites, frame.x, frame.y, 17, 12,
                -bird.width / 2, -bird.height / 2, bird.width, bird.height);
            ctx.restore();
        }

        // Score display
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(roundScore, gameCanvas.width / 2, 50);
        ctx.fillText(roundScore, gameCanvas.width / 2, 50);
    }

    // ─── Game Loop ────────────────────────────────────────────
    let pipeInterval = null;

    function gameLoop() {
        if (!running) return;

        // Scroll ground
        groundX -= PIPE_SPEED;
        if (groundX <= -224) groundX = 0;

        // Move pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= PIPE_SPEED;
            if (pipes[i].x + 52 < 0) pipes.splice(i, 1);
        }

        if (bird && bird.alive) {
            // Bird thinks
            const nearest = pipes.find(p => p.x + 52 >= bird.x) || pipes[pipes.length - 1];
            if (nearest) {
                const inputs = [
                    (nearest.x - bird.x) / gameCanvas.width,
                    bird.y / gameCanvas.height,
                    (bird.y - nearest.height) / gameCanvas.height,
                    (nearest.height + PIPE_GAP - bird.y) / gameCanvas.height
                ];
                if (bird.think(inputs)) {
                    bird.velocity = FLAP_SPEED;
                }
            }

            bird.update(pipes);

            // Track score (pipes passed)
            if (pipes.length > 0) {
                const firstPipe = pipes[0];
                if (!firstPipe.scored && firstPipe.x + 52 < bird.x) {
                    firstPipe.scored = true;
                    roundScore++;
                    if (roundScore > sessionHighScore) {
                        sessionHighScore = roundScore;
                        // Persist high score across tab closes
                        localStorage.setItem('vortex-highScore', sessionHighScore);
                    }
                }
            }
        } else if (bird) {
            // Bird is dead — wait a moment then restart
            deadTimer++;
            if (deadTimer > DEAD_DELAY) {
                resetRound();
            }
        }

        // Bird animation
        if (frameCount % 5 === 0) {
            currentFrame = (currentFrame + 1) % birdFrames.length;
        }
        frameCount++;

        // Draw
        drawGame();

        // Calculate uptime
        const elapsed = Date.now() - birthTimestamp;
        const totalSeconds = Math.floor(elapsed / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        // Report stats
        if (statsCallback) {
            statsCallback({
                bestScore: brainBestScore,
                currentScore: roundScore,
                highScore: sessionHighScore,
                alive: bird ? bird.alive : false,
                elapsedDays: days,
                elapsedHours: hours,
                elapsedMinutes: minutes
            });
        }

        requestAnimationFrame(gameLoop);
    }

    // ─── Start ────────────────────────────────────────────────
    sprites.onload = () => {
        pipeInterval = setInterval(spawnPipe, PIPE_SPAWN_INTERVAL);
        spawnPipe();
        gameLoop();
    };

    if (sprites.complete) {
        pipeInterval = setInterval(spawnPipe, PIPE_SPAWN_INTERVAL);
        spawnPipe();
        gameLoop();
    }

    return {
        destroy: () => {
            running = false;
            if (pipeInterval) clearInterval(pipeInterval);
            container.innerHTML = '';
            try { if (brain) brain.dispose(); } catch {}
        }
    };
}

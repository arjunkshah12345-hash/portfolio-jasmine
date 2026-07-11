/**
 * NEAT Flappy Bird — Evolving AI birds that learn to play Flappy Bird
 * Zero dependencies, pure JavaScript, canvas-based
 */
(function () {
  "use strict";

  // ─── Neural Network ───────────────────────────────────────────
  class NeuralNetwork {
    constructor(inputs, hidden, outputs, weights) {
      this.inputs = inputs;
      this.hidden = hidden;
      this.outputs = outputs;
      if (weights) {
        this.weightsIH = weights.weightsIH.map((r) => r.slice());
        this.weightsHO = weights.weightsHO.map((r) => r.slice());
        this.biasH = weights.biasH.slice();
        this.biasO = weights.biasO.slice();
      } else {
        this.weightsIH = Array.from({ length: hidden }, () =>
          Array.from({ length: inputs }, () => Math.random() * 2 - 1)
        );
        this.weightsHO = Array.from({ length: outputs }, () =>
          Array.from({ length: hidden }, () => Math.random() * 2 - 1)
        );
        this.biasH = Array.from({ length: hidden }, () => Math.random() * 2 - 1);
        this.biasO = Array.from({ length: outputs }, () => Math.random() * 2 - 1);
      }
    }

    sigmoid(x) {
      return 1 / (1 + Math.exp(-x));
    }

    feedforward(inputs) {
      // Input to hidden
      const hidden = this.biasH.map((b, i) =>
        this.sigmoid(
          this.weightsIH[i].reduce((sum, w, j) => sum + w * inputs[j], b)
        )
      );
      // Hidden to output
      return this.biasO.map((b, i) =>
        this.sigmoid(
          this.weightsHO[i].reduce((sum, w, j) => sum + w * hidden[j], b)
        )
      );
    }

    clone() {
      return new NeuralNetwork(this.inputs, this.hidden, this.outputs, {
        weightsIH: this.weightsIH,
        weightsHO: this.weightsHO,
        biasH: this.biasH,
        biasO: this.biasO,
      });
    }

    mutate(rate) {
      const mutateArr = (arr) => {
        for (let i = 0; i < arr.length; i++) {
          if (Array.isArray(arr[i])) {
            mutateArr(arr[i]);
          } else {
            if (Math.random() < rate) arr[i] += (Math.random() - 0.5) * 0.5;
            if (Math.random() < rate * 0.3) arr[i] = Math.random() * 2 - 1;
          }
        }
      };
      mutateArr(this.weightsIH);
      mutateArr(this.weightsHO);
      mutateArr(this.biasH);
      mutateArr(this.biasO);
    }

    crossover(other) {
      const child = this.clone();
      const cross = (a, b) => {
        for (let i = 0; i < a.length; i++) {
          if (Array.isArray(a[i])) {
            cross(a[i], b[i]);
          } else {
            if (Math.random() < 0.5) a[i] = b[i];
          }
        }
      };
      cross(child.weightsIH, other.weightsIH);
      cross(child.weightsHO, other.weightsHO);
      cross(child.biasH, other.biasH);
      cross(child.biasO, other.biasO);
      return child;
    }
  }

  // ─── Bird ─────────────────────────────────────────────────────
  class Bird {
    constructor(brain, idx) {
      this.idx = idx;
      this.x = 80;
      this.y = 300;
      this.vel = 0;
      this.gravity = 0.45;
      this.jumpForce = -7.5;
      this.alive = true;
      this.score = 0;
      this.fitness = 0;
      this.brain = brain || new NeuralNetwork(4, 8, 1);
      this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
      this.points = [
        { x: 0, y: 0 },
        { x: 14, y: -8 },
        { x: 14, y: 8 },
      ];
    }

    think(pipe) {
      if (!pipe) return;
      const inputs = [
        this.y / 600,
        pipe.top / 600,
        pipe.bottom / 600,
        Math.max(-1, Math.min(1, this.vel / 8)),
      ];
      const output = this.brain.feedforward(inputs);
      if (output[0] > 0.5) this.jump();
    }

    jump() {
      this.vel = this.jumpForce;
    }

    update() {
      this.vel += this.gravity;
      this.y += this.vel;
      this.fitness++;
    }

    draw(ctx) {
      if (!this.alive) return;
      const h = parseInt(this.color.match(/\d+/)[0]);
      // Body
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.min(0.5, Math.max(-0.5, this.vel * 0.05)));

      // Wing
      ctx.fillStyle = `hsl(${h + 20}, 65%, 55%)`;
      ctx.beginPath();
      ctx.ellipse(-2, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(5, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1c1a";
      ctx.beginPath();
      ctx.arc(6, -2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#e8a838";
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(14, 1);
      ctx.lineTo(8, 2);
      ctx.fill();

      ctx.restore();
    }

    isDead(groundY) {
      return this.y > groundY || this.y < -20;
    }

    hitsPipe(pipe) {
      const bx = this.x;
      const by = this.y;
      return (
        bx + 9 > pipe.x &&
        bx - 9 < pipe.x + pipe.width &&
        (by - 7 < pipe.top || by + 7 > pipe.bottom)
      );
    }
  }

  // ─── Pipe ─────────────────────────────────────────────────────
  class Pipe {
    constructor(x, canvasH) {
      this.x = x;
      this.width = 52;
      this.gap = 140;
      this.top = 80 + Math.random() * (canvasH - this.gap - 160);
      this.bottom = this.top + this.gap;
      this.scored = false;
      this.speed = 2;
    }

    update() {
      this.x -= this.speed;
    }

    draw(ctx) {
      // Top pipe
      const grad1 = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
      grad1.addColorStop(0, "#2d5a27");
      grad1.addColorStop(0.3, "#4a8c3f");
      grad1.addColorStop(0.7, "#4a8c3f");
      grad1.addColorStop(1, "#2d5a27");
      ctx.fillStyle = grad1;
      ctx.fillRect(this.x, 0, this.width, this.top);

      // Top pipe cap
      ctx.fillStyle = "#3d7a35";
      ctx.fillRect(this.x - 4, this.top - 20, this.width + 8, 20);
      ctx.strokeStyle = "#2d5a27";
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x - 4, this.top - 20, this.width + 8, 20);

      // Bottom pipe
      ctx.fillStyle = grad1;
      ctx.fillRect(this.x, this.bottom, this.width, 600 - this.bottom);

      // Bottom pipe cap
      ctx.fillStyle = "#3d7a35";
      ctx.fillRect(this.x - 4, this.bottom, this.width + 8, 20);
      ctx.strokeStyle = "#2d5a27";
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x - 4, this.bottom, this.width + 8, 20);
    }

    offscreen() {
      return this.x < -this.width;
    }
  }

  // ─── NEAT Flappy Bird Game ────────────────────────────────────
  class FlappyBirdGame {
    constructor(canvas, onStats) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.onStats = onStats;

      // Dimensions
      this.W = canvas.width;
      this.H = canvas.height || 600;
      this.groundY = this.H - 50;

      // Population
      this.popSize = 80;
      this.birds = [];
      this.pipes = [];
      this.generation = 1;
      this.bestScore = 0;
      this.allTimeBest = 0;
      this.startTime = Date.now();
      this.frameCount = 0;
      this.pipeCounter = 0;
      this.pipeInterval = 100;
      this.speed = 2;
      this.running = true;
      this.clock = 0;

      // Best bird trail
      this.bestTrail = [];

      // Background gradient
      this.bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.H);
      this.bgGrad.addColorStop(0, "#1a1a18");
      this.bgGrad.addColorStop(0.5, "#232320");
      this.bgGrad.addColorStop(1, "#2a2a26");

      // Ground
      this.groundOffset = 0;

      // Initialize
      this.initPopulation();
      this.loop = this.loop.bind(this);
      this.loop();
    }

    initPopulation() {
      this.birds = [];
      for (let i = 0; i < this.popSize; i++) {
        this.birds.push(new Bird(null, i));
      }
    }

    loop() {
      if (!this.running) return;
      this.clock++;
      this.update();
      this.draw();
      this.frameCount++;
      requestAnimationFrame(this.loop);
    }

    update() {
      // Spawn pipes
      this.pipeCounter++;
      if (this.pipeCounter >= this.pipeInterval) {
        this.pipes.push(new Pipe(this.W + 20, this.H));
        this.pipeCounter = 0;
        // Gradually increase difficulty
        this.pipeInterval = Math.max(65, this.pipeInterval - 0.05);
      }

      // Update pipes
      let aliveCount = 0;
      let bestBirdScore = 0;

      for (let i = this.pipes.length - 1; i >= 0; i--) {
        this.pipes[i].update();
        if (this.pipes[i].offscreen()) {
          this.pipes.splice(i, 1);
        }
      }

      // Find nearest pipe for each bird
      const getNextPipe = (bird) => {
        let nearest = null;
        for (const pipe of this.pipes) {
          if (pipe.x + pipe.width > bird.x) {
            nearest = pipe;
            break;
          }
        }
        return nearest;
      };

      // Update birds
      for (const bird of this.birds) {
        if (!bird.alive) continue;

        bird.think(getNextPipe(bird));
        bird.update();

        // Collision checks
        if (bird.isDead(this.groundY)) {
          bird.alive = false;
          continue;
        }

        const nextPipe = getNextPipe(bird);
        if (nextPipe && bird.hitsPipe(nextPipe)) {
          bird.alive = false;
          continue;
        }

        // Score
        if (nextPipe && !nextPipe.scored && nextPipe.x + nextPipe.width < bird.x) {
          nextPipe.scored = true;
          bird.score++;
          if (bird.score > this.bestScore) {
            this.bestScore = bird.score;
          }
          if (bird.score > bird.fitness) bird.fitness = bird.score * 100;
        }

        aliveCount++;
        if (bird.score > bestBirdScore) bestBirdScore = bird.score;
      }

      // Log best bird trail
      const bestBird = this.getBestBird();
      if (bestBird && bestBird.alive) {
        this.bestTrail.push({ x: bestBird.x, y: bestBird.y });
        if (this.bestTrail.length > 30) this.bestTrail.shift();
      }

      // Next generation
      if (aliveCount === 0) {
        this.nextGeneration();
      }

      // Stats callback
      if (this.onStats) {
        this.onStats({
          generation: this.generation,
          bestScore: this.bestScore,
          allTimeBest: this.allTimeBest,
          aliveCount: aliveCount,
          totalBirds: this.popSize,
          runningTime: Math.floor((Date.now() - this.startTime) / 1000),
        });
      }
    }

    draw() {
      const ctx = this.ctx;

      // Sky
      ctx.fillStyle = this.bgGrad;
      ctx.fillRect(0, 0, this.W, this.H);

      // Stars (subtle)
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5 + this.groundOffset * 0.02) % this.W;
        const sy = (i * 97.3) % (this.groundY - 50);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw pipes
      for (const pipe of this.pipes) {
        pipe.draw(ctx);
      }

      // Draw best bird trail
      if (this.bestTrail.length > 2) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(this.bestTrail[0].x, this.bestTrail[0].y);
        for (let i = 1; i < this.bestTrail.length; i++) {
          ctx.lineTo(this.bestTrail[i].x, this.bestTrail[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw birds (alive only, with brightness based on score)
      for (const bird of this.birds) {
        if (bird.alive) {
          ctx.globalAlpha = 0.85;
          bird.draw(ctx);
          ctx.globalAlpha = 1;
        }
      }

      // Ground
      this.groundOffset = (this.groundOffset + this.speed) % 48;
      ctx.fillStyle = "#1c1c1a";
      ctx.fillRect(0, this.groundY, this.W, this.H - this.groundY);
      // Ground line
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, this.groundY);
      ctx.lineTo(this.W, this.groundY);
      ctx.stroke();

      // Ground pattern
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let x = -this.groundOffset; x < this.W; x += 24) {
        ctx.fillRect(x, this.groundY + 1, 1, 3);
      }

      // Score overlay
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(`gen ${this.generation}`, 12, 20);
      ctx.fillText(`best ${this.bestScore}`, 12, 34);
      ctx.fillText(`all-time ${this.allTimeBest}`, 12, 48);
    }

    getBestBird() {
      let best = null;
      let bestScore = -1;
      for (const bird of this.birds) {
        if (bird.score > bestScore) {
          bestScore = bird.score;
          best = bird;
        }
      }
      return best;
    }

    nextGeneration() {
      // Sort by fitness (score)
      this.birds.sort((a, b) => b.fitness - a.fitness);

      const bestBird = this.birds[0];
      if (bestBird.score > this.allTimeBest) {
        this.allTimeBest = bestBird.score;
      }
      this.bestScore = 0;

      const keep = Math.max(2, Math.floor(this.popSize * 0.2));
      const breeders = this.birds.slice(0, keep);

      // Create next generation
      const nextGen = [];

      // Keep the top 2 unchanged
      nextGen.push(new Bird(breeders[0].brain.clone(), 0));
      if (breeders.length > 1) {
        nextGen.push(new Bird(breeders[1].brain.clone(), 1));
      }

      // Breed the rest
      while (nextGen.length < this.popSize) {
        const p1 = breeders[Math.floor(Math.random() * breeders.length)];
        const p2 = breeders[Math.floor(Math.random() * breeders.length)];
        const childBrain = p1.brain.crossover(p2.brain);
        childBrain.mutate(0.08);
        nextGen.push(new Bird(childBrain, nextGen.length));
      }

      this.birds = nextGen;
      this.pipes = [];
      this.pipeCounter = 0;
      this.bestTrail = [];
      this.generation++;
    }

    stop() {
      this.running = false;
    }

    resume() {
      if (!this.running) {
        this.running = true;
        this.loop();
      }
    }

    destroy() {
      this.running = false;
      this.canvas = null;
      this.ctx = null;
    }
  }

  // Export
  window.FlappyBirdGame = FlappyBirdGame;
})();

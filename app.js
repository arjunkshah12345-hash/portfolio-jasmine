(() => {
  const { useState, useCallback, useEffect } = React;
  const { motion, AnimatePresence } = window.Motion;
  const ease = [0.16, 1, 0.3, 1];
  const pageVariants = {
    initial: { opacity: 0, y: 10, filter: "blur(4px)" },
    enter: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease, staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.4, ease } }
  };
  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.8, ease } }
  };
  const JasmineBadge = () => {
    const [visible, setVisible] = useState(() => {
      return localStorage.getItem("jasmine-badge-dismissed") !== "true";
    });
    const dismiss = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      localStorage.setItem("jasmine-badge-dismissed", "true");
      setVisible(false);
    }, []);
    if (!visible) return null;
    return /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
        transition: { duration: 0.5, ease },
        style: { position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }
      },
      /* @__PURE__ */ React.createElement(
        "a",
        {
          href: "https://tryjasmine.dev",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "jasmine-badge",
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 36px 12px 20px",
            background: "rgba(18,18,18,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            textDecoration: "none",
            fontFamily: "'Iowan Old Style','Iowan Old Serif',Georgia,serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.02em",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)"
          }
        },
        /* @__PURE__ */ React.createElement(
          "img",
          {
            src: "https://tryjasmine.dev/logo-mark.png",
            alt: "Jasmine",
            width: "28",
            height: "28",
            style: { flexShrink: 0, objectFit: "contain", opacity: 0.95 }
          }
        ),
        /* @__PURE__ */ React.createElement("span", null, "Made with Jasmine")
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: dismiss,
          "aria-label": "Dismiss badge",
          style: {
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "rgba(18,18,18,0.95)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "12px",
            lineHeight: 1,
            padding: 0
          }
        },
        "\xD7"
      )
    );
  };
  const RevealText = ({ children, delay = 0, className = "" }) => /* @__PURE__ */ React.createElement(motion.div, { variants: itemVariants, className }, children);
  const Navigation = ({ currentPath, setPath }) => {
    const links = [
      { path: "/", label: "index" },
      { path: "/about", label: "about" },
      { path: "/work", label: "work" },
      { path: "/writing", label: "writing" },
      { path: "/contact", label: "contact" }
    ];
    return /* @__PURE__ */ React.createElement(
      motion.nav,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 1, delay: 0.5 },
        className: "fixed top-0 left-0 w-full p-5 md:p-8 flex justify-between items-start z-50 pointer-events-none"
      },
      /* @__PURE__ */ React.createElement("div", { className: "font-mono text-[10px] tracking-widest uppercase pointer-events-auto cursor-pointer", onClick: () => setPath("/") }, "A. Shah"),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end gap-2 pointer-events-auto" }, links.map((link) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: link.path,
          onClick: () => setPath(link.path),
          className: `font-mono text-[10px] tracking-widest uppercase transition-opacity duration-300 hover:opacity-100 ${currentPath === link.path ? "opacity-100" : "opacity-40"}`
        },
        link.label
      )))
    );
  };
  // ─── Flappy Bird Stats (isolated to prevent 60fps re-renders) ───
  const FlappyBirdStatsLabel = React.memo(({ stats }) => /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-4 mb-5 font-mono text-[10px] tracking-widest text-ink-light uppercase" },
    /* @__PURE__ */ React.createElement("span", null, "Generation ", stats.generation),
    /* @__PURE__ */ React.createElement("span", null, "Best Score ", stats.bestScore),
    /* @__PURE__ */ React.createElement("span", { className: "text-ink/50" }, "Uptime ", stats.elapsedDays, "d ", stats.elapsedHours, "h ", stats.elapsedMinutes, "m")
  ));

  // ─── NEAT Flappy Bird ────────────────────────────────────────
  const FlappyBirdHome = () => {
    const containerRef = React.useRef(null);
    const gameRef = React.useRef(null);
    const statsRef = React.useRef({ generation: 0, bestScore: 0, aliveCount: 0, totalGenerations: 0, elapsedDays: 0, elapsedHours: 0, elapsedMinutes: 0 });
    const [stats, setStats] = React.useState(statsRef.current);

    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      let mounted = true;
      initVortexFlappy('vortex-game-container', (newStats) => {
        const prev = statsRef.current;
        // Only trigger React re-render when something actually changes
        if (prev.generation !== newStats.generation ||
            prev.bestScore !== newStats.bestScore ||
            prev.aliveCount !== newStats.aliveCount ||
            prev.elapsedDays !== newStats.elapsedDays ||
            prev.elapsedHours !== newStats.elapsedHours ||
            prev.elapsedMinutes !== newStats.elapsedMinutes) {
          statsRef.current = newStats;
          setStats(newStats);
        }
      }).then(game => {
        if (!mounted && game) { game.destroy(); return; }
        gameRef.current = game;
      });
      return () => {
        mounted = false;
        if (gameRef.current) { gameRef.current.destroy(); gameRef.current = null; }
      };
    }, []);

    return /* @__PURE__ */ React.createElement(RevealText, null, /* @__PURE__ */ React.createElement("div", { className: "w-full py-8 md:py-12 border-t border-ink/10" },
      /* @__PURE__ */ React.createElement("h3", { className: "text-lg md:text-2xl tracking-tight mb-3" }, "NEAT Flappy Bird"),
      /* @__PURE__ */ React.createElement(FlappyBirdStatsLabel, { stats }),
      /* @__PURE__ */ React.createElement("div", { id: "vortex-game-container", ref: containerRef, className: "w-full max-w-[360px] mx-auto" }),
      /* @__PURE__ */ React.createElement("p", { className: "text-ink-light text-sm mt-4 max-w-xs mx-auto text-center italic" }, "neat flappy bird, learning forever.")
    ));
  };

  // ─── Cursor Particles ──────────────────────────────────────────
  const CursorParticles = () => {
    const canvasRef = React.useRef(null);
    const particlesRef = React.useRef([]);
    const mouseRef = React.useRef({ x: -100, y: -100 });
    const rafRef = React.useRef(null);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener('resize', resize);

      const onMove = (e) => {
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
        // Add particle
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          life: 1,
          size: 2 + Math.random() * 3,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.3
        });
        if (particlesRef.current.length > 40) {
          particlesRef.current = particlesRef.current.slice(-40);
        }
      };
      window.addEventListener('mousemove', onMove);

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.025;
          p.vy += 0.01;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(28, 28, 26, ${p.life * 0.12})`;
          ctx.fill();
        }

        rafRef.current = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMove);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    /* @__PURE */ return React.createElement('canvas', {
      ref: canvasRef,
      className: 'fixed inset-0 pointer-events-none z-[60]',
      style: { mixBlendMode: 'multiply' }
    });
  };

  const Home = () => /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "max-w-2xl w-full" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-5 text-lg md:text-2xl leading-relaxed md:leading-relaxed font-light tracking-tight" },
    /* @__PURE__ */ React.createElement(RevealText, null, /* @__PURE__ */ React.createElement("p", null, "hi, my name is arjun shah. this is my website, and i'm currently working on ", /* @__PURE__ */ React.createElement("a", { href: "https://supercompress.dev", target: "_blank", rel: "noopener noreferrer", className: "underline underline-offset-4 decoration-ink/30 hover:decoration-ink transition-all" }, "supercompress"), " \u2014 it is open source. i like doing cool stuff, and feel free to check out the website.")),
    /* @__PURE__ */ React.createElement(RevealText, null, /* @__PURE__ */ React.createElement("p", { className: "text-ink-light text-lg md:text-xl mt-8" }, "here's my pet, flappy bird:")),
    /* @__PURE__ */ React.createElement(FlappyBirdHome, null),
    /* @__PURE__ */ React.createElement(RevealText, null, /* @__PURE__ */ React.createElement("div", { className: "w-full py-4 border-t border-ink/10 space-y-4" },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-4" },
        /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[9px] tracking-widest uppercase text-ink-light" }, "\u25B6 episode 1 \u2014 watch the full journey"),
        /* @__PURE__ */ React.createElement("a", { href: "https://x.com/arjunkshah21/status/2075300855780356143/video/1/", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-[10px] tracking-widest uppercase text-ink-light hover:border-ink/35 hover:text-ink transition-colors group" },
          "Watch on X",
          /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true", className: "group-hover:translate-x-0.5 transition-transform" }, "\u2197")
        )
      ),
    )),
  ));
  const About = () => /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "max-w-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-8 text-lg md:text-xl leading-relaxed text-ink/80" }, /* @__PURE__ */ React.createElement("p", null, "i am arjun shah. i am 14 and i build like a founder. the goal is not to make things look impressive in isolation. it is to solve real problems, ship, and keep improving the system. i code in typescript, python, and swift, and my work spans the entire stack \u2014 from agent orchestration to neural compression to browser extensions."), /* @__PURE__ */ React.createElement("p", null, "my journey started with rooted.ai, which won the stanford gsb lisa startup competition. that taught me how to turn a question into a product, how to pitch it clearly, and how to validate the idea before it was fully formed."), /* @__PURE__ */ React.createElement("div", { className: "py-8" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: "/about.jpg",
      alt: "Arjun Shah smiling at a desk with his mom beside him.",
      className: "w-full h-auto rounded-md shadow-md object-cover"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "font-mono text-[10px] text-ink-light mt-3 tracking-widest uppercase" }, "Fig 1. Momentum over perfection.")), /* @__PURE__ */ React.createElement("p", null, "after that, i built and scaled ideatr.dev to over 100 active users in a few months. seeing real people use my software changed how i think about product, distribution, and the cost of being wrong."), /* @__PURE__ */ React.createElement("p", null, "in 2026, i launched supercompress (neural context compression for AI agents), ascii-skill (world-class ASCII art for any agent), and kept building loopy. i also won early traction with pincer (a dyslexia-friendly browser extension) and jasmine (AI frontend design with taste)."), /* @__PURE__ */ React.createElement("p", null, "i now host my code on gitlab (gitlab.com/arjunkshah) and github. i'm starting to document my full journey on video \u2014 episode 1 is live on X. it covers what drives a 14-year-old building at the intersection of AI, product design, and agent infrastructure."), /* @__PURE__ */ React.createElement("p", null, "now i am focused on the intersection of artificial intelligence, product-level design, and execution. that is why i am building loopy, supercompress, ascii-skill, pincer, jasmine, and everything around autonomous agents and design taste.")));
  const workProjects = [
    {
      slug: "loopy",
      year: "Now",
      title: "Loopy",
      url: "https://loopy.yachts",
      linkLabel: "Live",
      tag: "Agent",
      videoUrl: "https://x.com/arjunkshah21/status/2065643348711428271",
      videoLabel: "Demo Video",
      desc: "Autonomous software engineer that researches, plans, builds, fixes, and loops until the product is done.",
      overview: [
        "Loopy is my autonomous software engineer.",
        "You give it an idea and it handles the loop: research, planning, implementation, commits, bugfixes, and task tracking.",
        "The system is built around short execution cycles so it can re-read the repo, update state, and keep moving without dragging stale context through every step.",
        "That matters because long-running agents fail when they treat old decisions like current ones. Loopy tries to keep the goal, the task list, and the codebase in sync."
      ]
    },
    {
      slug: "supercompress",
      year: "2026",
      title: "Supercompress",
      url: "https://supercompress.dev",
      linkLabel: "Live",
      tag: "AI",
      videoUrl: "https://x.com/arjunkshah21/status/2070570033953263850",
      videoLabel: "Launch Video",
      desc: "Neural context compression for long-running AI agents. Cuts token costs by ~65%.",
      overview: [
        "Supercompress started as a fix for the context problem inside Loopy.",
        "It compresses long agent history while preserving the decisions, constraints, code references, failures, todos, and state that actually matter.",
        "The technical goal is signal preservation under token pressure: keep enough structured memory for the agent to continue correctly, but remove the noise that wastes budget.",
        "It cuts token usage by around 65% while retaining about 98.7% of the important information.",
        "That turned into a reusable memory layer for long-running workflows instead of a generic summary tool.",
        "Supercompress now ranks #1 on Google for its category, proving that signal-preserving compression is the future of agent memory."
      ]
    },
    {
      slug: "ascii-skill",
      year: "2026",
      title: "ascii-skill",
      url: "https://gitlab.com/arjunkshah/ascii-skill",
      linkLabel: "GitLab",
      tag: "Art",
      gitlab: "https://gitlab.com/arjunkshah/ascii-skill",
      videoUrl: "/ascii-skill-launch.mp4",
      videoLabel: "Launch Reel",
      desc: "World-class ASCII art for any AI agent. Scenes, UI, 3D, animations — zero dependencies.",
      overview: [
        "ascii-skill is an AI agent skill for generating world-class ASCII art.",
        "It supports scenes, user interfaces, 3D rotating objects (spheres, cubes, toruses), particle systems, wireframe terrain, and animations — all with zero external dependencies.",
        "The technical challenge was building a full ASCII rendering engine in pure Python that any AI agent could import and use without installing any additional libraries.",
        "It works across terminals, logs, build output, and any text-based interface where ASCII art adds personality and clarity.",
        "The project has already generated over 124 ASCII pieces with 420+ keywords and 15 style presets.",
        "Install it with: npx skills add arjunkshah/ascii-skill"
      ]
    },
    {
      slug: "pincer",
      year: "2026",
      title: "Pincer",
      url: "https://trypincer.netlify.app/",
      linkLabel: "Live",
      tag: "Access",
      videoUrl: "https://x.com/arjunkshah21",
      videoLabel: "Demo on X",
      desc: "Chrome extension that modifies page content to support dyslexic and neurodivergent users.",
      overview: [
        "Pincer is a browser extension built to make web content more accessible for dyslexic and neurodivergent users.",
        "It works as an on-page reading layer, modifying content in place so the page stays usable while the visual noise gets reduced.",
        "The technical problem is browser DOM manipulation at the content-script level: rewriting text presentation without breaking layout, focus, or navigation.",
        "It sits closer to accessibility tooling than a demo app — focused on real usability for people who struggle with dense web layouts."
      ]
    },
    {
      slug: "rooted",
      year: "Last year",
      title: "rooted.ai",
      url: "https://rooted-ai.vercel.app",
      linkLabel: "Live",
      tag: "Stanford",
      desc: "Stanford GSB LISA project focused on AI-driven natural health exploration.",
      overview: [
        "rooted.ai came out of a question about why modern health advice feels so fragmented.",
        "The project explored how AI could organize natural remedies and lifestyle practices into a structured, evidence-aware system.",
        "The product work was about turning a broad topic into a usable information flow with clear categories, trust signals, and a cleaner path from question to answer.",
        "It was the first project that forced the idea into a real founder-shaped product."
      ]
    },
    {
      slug: "ideatr",
      year: "Last year",
      title: "ideatr.dev",
      url: "https://github.com/arjunkshah/ideatr",
      linkLabel: "Repo",
      tag: "Tool",
      videoUrl: "https://x.com/arjunkshah21",
      videoLabel: "Demo on X",
      desc: "Clone and recreate any website as a modern React app in seconds.",
      overview: [
        "ideatr taught me how fast distribution and iteration start to matter once people actually use the product.",
        "The project focused on turning web ideas into modern React builds quickly, so a site could be translated from reference to working UI in a short loop.",
        "The technical challenge was reducing the distance between intent, layout, and implementation without losing the structure that makes the original page recognizable.",
        "It became an early lesson in shipping and listening instead of overbuilding."
      ]
    },
    {
      slug: "tryjasmine",
      year: "Last year",
      title: "tryjasmine.dev",
      url: "https://tryjasmine.dev",
      linkLabel: "Live",
      tag: "Design",
      desc: "AI frontend design with stronger taste and less slop.",
      overview: [
        "Jasmine is the AI frontend engineer behind this portfolio's visual direction.",
        "The focus is not just generating interfaces, but making them feel deliberate, calm, and crafted.",
        "Technically, the product is about pushing generated UI away from default composition and toward stronger decisions around spacing, typography, motion, and hierarchy.",
        "It is where the product taste work became a product itself."
      ]
    },
    {
      slug: "neat-flappy-bird",
      year: "2025",
      title: "NEAT Flappy Bird",
      url: "https://github.com/arjunkshah/Vortex21-X.github.io",
      linkLabel: "Repo",
      tag: "Game",
      desc: "Flappy Bird where AI birds learn to play through evolution.",
      overview: [
        "This is the Flappy Bird project that used evolving neural network agents.",
        "The birds improve across generations by learning which decisions keep them alive longer.",
        "The technical idea is simple neuroevolution: evaluate fitness, keep the better agents, mutate the next generation, and repeat until the policy improves.",
        "It is a small game, but the underlying idea is the same one I keep returning to: systems that learn over time."
      ]
    },
    {
      slug: "typing-club-bot",
      year: "2024",
      title: "Typing Club Bot",
      url: "https://github.com/arjunkshah/Typing-Club-Bot",
      linkLabel: "Repo",
      tag: "Automation",
      desc: "Typing Club automation and practice tooling.",
      overview: [
        "Typing Club Bot was an early automation project.",
        "It focused on repeatable typing workflows and reducing friction in a very specific task.",
        "The technical shape was a narrow automation loop: observe the target, reproduce the typing interaction, and keep the workflow consistent enough to be useful.",
        "It is one of the earliest examples of me building small tools around a narrow pain point."
      ]
    }
  ];
  const workProjectMap = Object.fromEntries(workProjects.map((project) => [project.slug, project]));
  const Work = ({ setPath }) => /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "max-w-3xl w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col w-full" }, workProjects.map((project) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: project.slug,
      onClick: () => setPath(`/work/${project.slug}`),
      className: "group flex items-center justify-between gap-4 border-b border-ink/5 py-8 md:py-12 hover:border-ink/20 transition-colors duration-500 cursor-pointer"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-mono text-xs text-ink-light w-16 shrink-0" }, project.year), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("h3", { className: "text-2xl md:text-4xl tracking-tight transition-transform duration-500 group-hover:translate-x-2" }, project.title), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono tracking-widest uppercase bg-ink/5 rounded-full px-2 py-0.5 text-ink-light/70" }, project.tag), project.videoUrl && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono tracking-widest uppercase border border-ink/15 rounded-full px-2 py-0.5 text-ink-light", title: "Demo video available" }, "Video")), /* @__PURE__ */ React.createElement("p", { className: "text-ink-light text-base md:text-lg max-w-xl" }, project.desc))),
    /* @__PURE__ */ React.createElement(
      "a",
      {
        href: project.url,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: (e) => e.stopPropagation(),
        className: "shrink-0 inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-[10px] tracking-widest uppercase text-ink-light hover:border-ink/35 hover:text-ink transition-colors"
      },
      project.linkLabel,
      /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2197")
    )
  ))));
  const ProjectDetail = ({ project, setPath }) => /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "max-w-3xl w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-6 mb-12" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setPath("/work"), className: "font-mono text-[10px] tracking-widest uppercase text-ink-light hover:text-ink transition-colors" }, "Back"), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: project.url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-[10px] tracking-widest uppercase text-ink-light hover:border-ink/35 hover:text-ink transition-colors"
    },
    project.linkLabel,
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2197")
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-8" }, /* @__PURE__ */ React.createElement("p", { className: "font-mono text-[10px] tracking-widest text-ink-light uppercase" }, project.year), /* @__PURE__ */ React.createElement("h2", { className: "text-4xl md:text-6xl tracking-tight" }, project.title), /* @__PURE__ */ React.createElement("p", { className: "text-lg md:text-2xl leading-relaxed text-ink/80 max-w-2xl" }, project.desc),
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-3 pt-4" }, project.gitlab && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: project.gitlab,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-[10px] tracking-widest uppercase text-ink-light hover:border-ink/35 hover:text-ink transition-colors"
      },
      "GitLab",
      /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2197")
    ), project.videoUrl && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: project.videoUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-[10px] tracking-widest uppercase text-ink-light hover:border-ink/35 hover:text-ink transition-colors"
      },
      project.videoLabel || "Demo Video",
      /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u25B6")
    )),
    /* @__PURE__ */ React.createElement("div", { className: "space-y-6 pt-6 text-lg md:text-xl leading-relaxed text-ink/90 max-w-2xl" }, project.overview.map((paragraph, idx) => /* @__PURE__ */ React.createElement("p", { key: idx }, paragraph)))));
  const Writing = () => {
    const essays = [
      {
        date: "New",
        title: "Who Is Arjun Shah? A 14-Year-Old AI Founder Building the Future of Autonomous Agents",
        content: [
          "this is the definitive answer to the question: who is arjun shah?",
          "if you are reading this, you probably searched for my name. welcome. i am arjun shah, a 14-year-old developer, founder, and builder based in the san francisco bay area. i build artificial intelligence systems, autonomous software agents, context compression engines, and design tools. my work is intentionally focused on the infrastructure layer of the AI ecosystem.",
          "i started coding at age 7. my first language was python, learned on tynker. by age 10, i was experimenting with neural networks. by 12, i was shipping my first products. by 13, i won the stanford graduate school of business LISA startup competition with rooted.ai, an AI-powered platform for exploring natural health knowledge. by 14, i grew ideatr.dev to over 100 active users and launched multiple new products.",
          "my current projects include loopy (an autonomous software engineer that researches, plans, builds, and fixes code until the product is done), supercompress (neural context compression that cuts token costs by ~65% for long-running AI agents), ascii-skill (a world-class ASCII art engine for AI agents with zero dependencies), pincer (a Chrome extension for dyslexic and neurodivergent users), and jasmine (an AI frontend engineer with design taste).",
          "i code in typescript, python, and swift. my work spans the full stack: from agent orchestration systems to browser extensions, from neural compression to frontend design. i host 86+ repositories across gitlab (gitlab.com/arjunkshah) and github (github.com/arjunkshah).",
          "i believe in shipping fast, iterating relentlessly, and building tools that are quiet, intentional, and powerful. i document my full journey on video \u2014 episode 1 of the life series is live on my X profile (x.com/arjunkshah21).",
          "my goal is straightforward: build the systems that make autonomous agents actually useful. better memory, better compression, better execution loops, better design taste. that is what defines arjun shah."
        ]
      },
      {
        date: "New",
        title: "Why I Code: A 14-Year-Old's Journey from Python to AI Agents",
        content: [
          "i did not start coding because someone told me it was a good career move. i started because i was curious.",
          "at 7, i found tynker. it taught me python through puzzles. i remember the first time i made something appear on screen. it felt like magic. not the superficial kind. the kind where you realize you can create something from nothing.",
          "by 9, i had moved past tutorials. i started building small scripts, automation tools, things that solved problems i actually had. the shift from consumer to creator happened without me noticing. i just kept building because it was fun.",
          "at 10, i discovered neural networks. i did not fully understand the math (honestly, i still do not understand all of it \u2014 but i understand enough). i built small models, trained them on toy datasets, watched them learn. the idea that code could improve itself was intoxicating.",
          "by 12, i was shipping. my first real product was a typing club bot \u2014 a small automation tool. it was not glamorous, but it taught me something important: building is easy. shipping is hard. getting someone to use what you built is the real challenge.",
          "at 13, i built rooted.ai and entered the stanford GSB LISA startup competition. i did not think i would win. but i did. standing on that stage as a 13-year-old pitching an AI health platform to stanford professors was surreal. it taught me that age is irrelevant. ideas and execution are what matter.",
          "at 14, everything accelerated. i built ideatr.dev and watched it grow to 100+ users. i launched loopy, supercompress, ascii-skill, pincer, and jasmine. i went from building for myself to building for other people. the shift in responsibility changed everything.",
          "now i spend my days thinking about agent memory, context compression, design taste, and execution loops. i work across typescript, python, and swift. i host 86+ repos on gitlab and github. every project is an attempt to solve a real problem \u2014 not a demo, not a toy, not a portfolio filler.",
          "why do i code? because building is how i think. because i want to see what happens when autonomous agents actually work. because i believe the next decade belongs to systems that learn, adapt, and improve without human hand-holding.",
          "and because, at 7, i made something appear on screen for the first time. i have been chasing that feeling ever since."
        ]
      },
      {
        date: "New",
        title: "Episode 1: Documenting My Life as a 14-Year-Old Builder",
        content: [
          "i decided to start documenting my journey on video.",
          "not the polished, produced version of my life. the real version.",
          "the late nights debugging agent loops. the excitement of a project finally working. the moments of doubt when nothing compiles. the wins that make it all worth it.",
          "i am 14 years old. i build AI agents, compression tools, ASCII art engines, accessibility extensions, and design systems. and i think the story behind the building matters as much as the code.",
          "episode 1 is the introduction. it covers:",
          "who i am \u2014 arjun shah, 14, founder and developer in the bay area.",
          "what i build \u2014 loopy, supercompress, ascii-skill, pincer, jasmine, and more.",
          "why i build \u2014 because i believe AI agents need better infrastructure, better memory, and better taste.",
          "and where this is going \u2014 a raw, unfiltered look at what it means to be a teenage founder building at the frontier of autonomous agents.",
          "the video is live on X: x.com/arjunkshah21/status/2075300855780356143",
          "this series is not about views. it is about keeping a record. a time capsule of the building years.",
          "because one day, i want to look back and see exactly how it all started.",
          "episode 1 is the first frame.",
          "more coming."
        ]
      },
      {
        date: "New",
        title: "Building ascii-skill: ASCII Art for the AI Age",
        content: [
          "i built ascii-skill because i wanted AI agents to have a creative outlet.",
          "not everything an agent produces has to be code, text, or data. sometimes an agent should just draw something cool in the terminal.",
          "ascii-skill is an AI agent skill for world-class ASCII art. it supports scenes, user interfaces, 3D rotating objects, particle systems, wireframe terrain, and animations.",
          "and it has zero dependencies. you can import it into any Python agent without installing anything extra.",
          "the technical challenge was building a full ASCII rendering engine that could handle:",
          "3D mathematics \u2014 rotating spheres, cubes, and toruses projected onto a 2D character grid.",
          "particle systems \u2014 fire, smoke, and spark effects using only ASCII characters.",
          "wireframe rendering \u2014 terrain and complex shapes using line-drawing characters.",
          "animation loops \u2014 frame-by-frame updates that create smooth motion in the terminal.",
          "all of this had to work without numpy, without curses, without any external library. just pure Python and math.",
          "the project has already generated over 124 ASCII pieces with 420+ keywords and 15 style presets. people are using it in their own agents, and the community is growing.",
          "you can install it with: npx skills add arjunkshah/ascii-skill",
          "the code is on gitlab: gitlab.com/arjunkshah/ascii-skill",
          "the launch reel is on my X: x.com/arjunkshah21",
          "i built ascii-skill because i think AI should be able to make things that are beautiful, not just useful.",
          "ASCII art is useless in the practical sense. and that is exactly why it matters."
        ]
      },
      {
        date: "New",
        title: "Building Loopy: Creating an Autonomous Software Engineer",
        content: [
          "loopy started with a simple question: what if an AI agent could build an entire product from a single idea?",
          "not a prototype. not a demo. a real product with real code, real commits, real testing, real iteration. you give it an idea, it comes back with a working project.",
          "that is what loopy aims to be: an autonomous software engineer that researches, plans, builds, fixes, and loops until the product is done.",
          "the architecture is built around short execution cycles. loopy re-reads the repo state after every step. it updates its task list. it commits code. it checks for bugs. it keeps moving forward without dragging stale context through every step.",
          "why is this hard? because long-running agents have a fundamental problem: they forget. a five-minute demo looks great. a five-hour session falls apart. the agent loses track of what it already did, what decisions it made, what bugs it already fixed.",
          "loopy solves this by treating context as a managed resource. every loop, the agent reviews what changed, what is still broken, and what the goal actually is. it does not guess. it reads the current state and acts.",
          "the technical stack includes typescript for the orchestration layer, with integrations for git, task tracking, and code analysis tools. the compression layer (supercompress) feeds into loopy to keep context windows manageable.",
          "loopy is still early. it works well for some types of projects and struggles with others. but the direction is clear: autonomous agents that can build real software without constant human supervision.",
          "you can see loopy in action at loopy.yachts. demo video on my X: x.com/arjunkshah21."
        ]
      },
      {
        date: "New",
        title: "The 86 Repos: How I Ship Across GitLab and GitHub",
        content: [
          "people ask why i have 86 repositories. the answer is simple: i ship constantly.",
          "every idea becomes a repo. every experiment becomes a commit. every tool i build for myself gets pushed to gitlab or github so someone else can use it.",
          "my code is split across two platforms: gitlab (gitlab.com/arjunkshah) and github (github.com/arjunkshah). gitlab is where the newer projects live \u2014 ascii-skill, supercompress, and the active development work. github hosts the older projects like ideatr, NEAT Flappy Bird, and Typing Club Bot.",
          "why two platforms? because different communities live on each. gitlab has a strong CI/CD culture and is where i ship experimental projects. github has the largest developer community and is where i share open-source tools.",
          "each repo represents a decision: build something, ship it, learn from it, move on. not every project is successful. many are unfinished. some are just experiments that taught me one thing and were done.",
          "that is the point. the 86 repos are not a portfolio. they are a log of a builder in motion. each one is a snapshot of what i was thinking about, what problem i was trying to solve, what tool i needed in that moment.",
          "if you are a developer reading this: stop optimizing. start shipping. create the repo. write the README. push the code. someone will find it and use it. that is how open source works. that is how i learned.",
          "the next repo is always the most important one."
        ]
      },
      {
        date: "Recent",
        title: "i built supercompress",
        content: [
          "i kept running into the same problem with ai agents.",
          "not the demo problem.",
          "the real problem.",
          "context.",
          "when an agent runs for five minutes, everything looks amazing. when it runs for five hours, everything starts breaking.",
          "it forgets what it already did. it repeats work. it loses the original goal. it starts treating old decisions like new ideas. it burns tokens for no reason.",
          "i saw this while building loopy.",
          "loopy is my autonomous software engineer. the goal is simple: give it an idea, and it researches, plans, builds, tracks tasks, commits code, fixes bugs, and keeps looping until the product is done.",
          "but the longer loopy ran, the more obvious the bottleneck became.",
          "the agent did not need more prompts.",
          "it needed better memory.",
          "so i built supercompress.",
          "supercompress is a neural context compression tool for ai agents.",
          "the goal is not to summarize text into generic bullets. that loses too much signal.",
          "the goal is to compress long context while preserving the parts an agent actually needs to keep working: decisions, constraints, code references, failures, todos, reasoning trails, and important state.",
          "basically, the stuff a human engineer would remember.",
          "the first version was simple. take a long agent context. compress it. feed it back in. see what broke.",
          "a lot broke.",
          "early versions were too aggressive. they saved tokens, but the agent lost important details. then some versions kept too much and were not useful. the hard part was finding the line between compression and memory loss.",
          "eventually, supercompress started working.",
          "it cut token usage by around 65% while retaining about 98.7% of the important information.",
          "that changed the whole system.",
          "loopy became cheaper. it became faster. it stayed on task longer. it stopped dragging around huge messy context windows. it could carry forward the right state instead of the entire conversation.",
          "technically, supercompress is built around signal-preserving compression for agent memory. it is designed for long-running workflows where context keeps growing every loop.",
          "it focuses on preserving things like project goals, implementation decisions, files changed, bugs found, tasks completed, unresolved issues, constraints from the user, and next actions.",
          "that matters because agents are not just chat interfaces anymore.",
          "they are becoming workers.",
          "and workers need memory.",
          "not infinite memory.",
          "useful memory.",
          "that is the difference.",
          "a normal chatbot can forget things and still be fine. but an autonomous coding agent cannot forget why it created a file, what bug it already fixed, or what the user explicitly told it not to do.",
          "that is why i think compression is going to be a core part of agent infrastructure.",
          "everyone is trying to build smarter agents.",
          "but smarter agents with bad memory still fail.",
          "supercompress is my attempt at fixing that layer.",
          "it is live now: trysupercompress.vercel.app",
          "and the code is here: github.com/arjunkshah/supercompress",
          "this started as a problem inside loopy, but it became its own thing.",
          "because the more i build agents, the more i believe this:",
          "the future of agents is not just better models.",
          "it is better systems around the models.",
          "memory. compression. state. feedback loops. execution.",
          "that is what makes an agent actually useful.",
          "supercompress is one piece of that.",
          "and i am done with the first version."
        ]
      },
      {
        date: "Recent",
        title: "Building Jasmine: Why AI UI Needs Taste",
        content: [
          "we are entering an era where software can build software.",
          "ask an ai to generate a website and it will give you one in seconds. ask it for a landing page and you get a fully functioning product. buttons, sections, components, colors \u2014 all assembled instantly.",
          "on the surface, this feels like magic. but if you look closely, something feels off. most ai-generated interfaces look the same. they are technically correct. they work. they render. but they lack something important. taste.",
          "today\u2019s ai tools are incredibly good at producing structure. they know how to assemble navigation bars, hero sections, pricing tables, dashboards, forms. the output is functional. but design is not just structure. design is judgment.",
          "when a human designer builds something good, they keep asking: should this be lighter or darker? is this spacing too tight? does this font feel right? does this interaction delight or annoy? these subtle calls separate crafted from generated. ai today mostly produces the second \u2014 the ai slop \u2014 not because the code is wrong, but because the design has no soul.",
          "taste is the invisible layer of software. it is what makes stripe feel calm, linear feel precise, apple feel intentional. it shows up in border weight, animation timing, whitespace, typography. none of these are necessary for the product to function, but together they make it feel right.",
          "most ai builders optimize for speed, not taste. they lean on default fonts, generic palettes, predictable layouts. ten ai-generated sites look like cousins: same grid, same spacing, same components, different text. fast, but forgettable.",
          "what ai ui systems lack is a point of view. great designers have opinions about layouts, type, spacing. taste is encoded judgment. that\u2019s missing in most ai design systems.",
          "jasmine started as a simple question: what if ai could design with taste? not just assemble components or generate code, but make the choices a thoughtful designer would \u2014 when minimalism works, when personality matters, when whitespace should breathe, when typography should lead.",
          "the aim isn\u2019t to replace designers; it\u2019s to raise the baseline. most products aren\u2019t built by elite studios. founders and small teams deserve tools that output beautiful starting points, not templates they want to redo.",
          "good software feels calm and intentional because someone made thousands of tiny decisions so the user doesn\u2019t have to. taste compresses complexity into simplicity. if ai is going to build the next generation of interfaces, it can\u2019t just generate code \u2014 it has to understand taste. that is what jasmine is trying to build."
        ]
      },
      {
        date: "Archive",
        title: "Scaling to 100 Users: Lessons from ideatr.dev",
        content: [
          "most people think the first milestone for a product is 1,000 users. but the real milestone is 100. not signups. not visitors. users. people who actually open the product and use it. getting the first 100 is where you learn everything. ideatr.dev taught me that.",
          "in the beginning, it feels like progress is measured in features: new pages, new tools, better prompts, more integrations. you feel productive. but none of that matters if nobody uses the product. the hardest moment for a builder is realizing that building is the easy part. distribution is the real challenge.",
          "user number one is not scalable. it comes from conversations. you send the link to friends. you post in small communities. you message people who might care. sometimes they try it. sometimes they ignore it. the important thing is not the growth rate. the important thing is watching how they use it.",
          "before users arrive, the product exists in your head. once users arrive, reality starts correcting you. buttons that seemed obvious confuse people. features you thought were important get ignored. tiny details you barely noticed become the most valuable parts. early users reshape the product.",
          "at the beginning, you cannot wait for perfect. the best feedback loop looks like: build \u2192 ship \u2192 watch \u2192 improve. every day. sometimes multiple times per day. the goal is not to build something flawless. the goal is to learn faster than yesterday. speed compounds.",
          "distribution is its own system. for ideatr.dev, early growth came from builder-heavy spaces: developer communities, indie hacker spaces, product forums, small tech twitter circles. these places have curiosity; people there are willing to try unfinished tools.",
          "the first 100 users are collaborators. they find bugs, suggest features, explain what is confusing, and can help shape direction. if you listen closely, they will tell you exactly what to build next.",
          "early on, most metrics are meaningless. page views and impressions do not matter. what matters: are people coming back? are they completing something valuable? are they telling someone else? if yes, the product is alive.",
          "when a product reaches 100 real users, it stops being an experiment and becomes a system. people depend on it. bugs, design, and reliability matter more. you start building for a small community, not just yourself.",
          "the first 100 users are about understanding: what the product really is, who it helps, and why someone would choose it over anything else. once you know that, the path to the next 1,000 is clearer. everything starts with the first 100."
        ]
      },
      {
        date: "Archive",
        title: "Winning Stanford GSB LISA at 14",
        content: [
          "most people think startups begin with companies. they usually begin with questions. for me, the question was: why does modern health feel so complicated? thousands of supplements, endless advice, contradictions everywhere. meanwhile, ancient systems like ayurveda and traditional chinese medicine hold centuries of knowledge, but it\u2019s buried and scattered. that question became rooted.ai and the idea we brought to the stanford gsb lisa accelerator.",
          "rooted.ai rests on a belief: the future of health will combine ancient wisdom and modern intelligence. traditional healing systems studied how food, herbs, and lifestyle affect the body. modern ai can organize, understand, and personalize that knowledge. the goal: an ai system that lets people explore natural remedies and lifestyle practices in a structured, personalized, evidence-aware way \u2014 a knowledge system for natural health.",
          "pitching an early idea is strange because you describe something that doesn\u2019t fully exist. the pitch centered on the problem (health advice is fragmented), the opportunity (ai can organize massive bodies of knowledge), and the vision (a system where anyone can explore natural remedies, their history, and ties to modern science \u2014 making health clearer, not noisier).",
          "lisa isn\u2019t just pitching; it\u2019s about thinking like a founder. it forces hard questions: who is this for? why now? what makes it unique? why you? those questions create clarity, and clarity is a founder\u2019s most valuable asset.",
          "a surprising lesson: age mattered far less than curiosity. people cared about ideas, not credentials. if you\u2019re genuinely trying to build something meaningful, people listen.",
          "winning lisa was exciting, but the real value was refinement. clearer problem, clearer vision, clearer direction. that\u2019s what early startup experiences offer: not just recognition, but sharpening.",
          "startups start with curiosity, not certainty. rooted.ai began with a simple question about health. lisa helped turn that question into a real idea. now the work is building it."
        ]
      },
      {
        date: "Archive",
        title: "The Elegance of Shipping Fast",
        content: [
          "there is a strange myth in software: people think great products are built slowly \u2014 carefully planned, perfectly designed, fully polished before the world sees them. in reality, most great products are shipped early, improved constantly, and shaped by real users. speed is not chaos. speed is a strategy.",
          "waiting to ship has a hidden cost. \u201Cone more feature,\u201D \u201Cdesign isn\u2019t perfect,\u201D \u201Cclean up the code first\u201D all sound reasonable, but every day you delay is a day without feedback. feedback is the only thing that tells you if the idea actually works. shipping turns guesses into knowledge.",
          "before shipping, the product lives in your head where everything makes sense. once you ship, reality shows up: users misunderstand, features get ignored, odd behaviors emerge. that isn\u2019t failure \u2014 it\u2019s the product becoming real.",
          "fast teams aren\u2019t just quick; they learn faster than everyone else. each release answers questions: does this feature help? does this design reduce friction? does this workflow make sense? ship monthly and you learn monthly; ship daily and you learn daily. speed compounds.",
          "shipping fast creates momentum. builders feel progress, users see improvement, the product evolves continuously. that builds trust. a slow product feels abandoned; a fast-moving product feels exciting and alive.",
          "big launches are overrated. most successful products grow through small releases \u2014 tiny improvements, small features, incremental refinements. each step seems minor, but together they add up to massive progress.",
          "fast does not mean careless. it means prioritizing learning. build the smallest thing that proves an idea, then improve it. this reduces risk; you find out quickly instead of spending months on the wrong thing.",
          "there is elegance in iteration. products that evolve in public feel alive. users see progress and participate in the journey. the product becomes a shared story between builder and user.",
          "in the end, shipping fast is about clarity. the faster you ship, the faster reality reveals what matters \u2014 what users care about, what features actually help, what ideas to abandon. speed removes illusion. clarity is a builder\u2019s advantage."
        ]
      }
    ];
    const [selected, setSelected] = useState(essays[0]);
    return /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "max-w-2xl w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-8 md:gap-12" }, essays.map((essay) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: essay.title,
        type: "button",
        onClick: () => setSelected(essay),
        className: `w-full flex flex-col gap-2 text-left cursor-pointer group ${selected.title === essay.title ? "opacity-100" : "opacity-60 hover:opacity-100"} transition-opacity duration-300`
      },
      /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10px] tracking-widest text-ink-light uppercase" }, essay.date),
      /* @__PURE__ */ React.createElement("h3", { className: "text-xl md:text-2xl tracking-tight group-hover:italic transition-all duration-300" }, essay.title)
    ))), (selected == null ? void 0 : selected.content) && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "mt-10 md:mt-14 space-y-6 text-lg md:text-xl leading-relaxed text-ink/90",
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease }
      },
      selected.content.map((para, idx) => /* @__PURE__ */ React.createElement("p", { key: idx }, para))
    ));
  };
  const Admin = () => {
    const [authed, setAuthed] = useState(() => {
      if (typeof window === "undefined") return false;
      return localStorage.getItem("admin-authed") === "true";
    });
    const [password, setPassword] = useState("");
    const [entries, setEntries] = useState([]);
    const [done, setDone] = useState(() => {
      if (typeof window === "undefined") return {};
      try {
        return JSON.parse(localStorage.getItem("admin-done") || "{}");
      } catch (e) {
        return {};
      }
    });
    useEffect(() => {
      const load = async () => {
        try {
          const res = await fetch("/draft_posts.txt", { cache: "no-store" });
          if (!res.ok) throw new Error("drafts missing");
          const text = await res.text();
          const lines = text.split("\n").filter(Boolean);
          const parsed = lines.map((line, idx) => {
            const match = line.match(/^\[(.*?)\]\s*(.*)$/);
            return {
              id: idx,
              timestamp: match ? match[1] : "unknown",
              text: match ? match[2] : line
            };
          }).reverse();
          setEntries(parsed);
        } catch (err) {
          console.error(err);
          setEntries([]);
        }
      };
      load();
    }, []);
    useEffect(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("admin-done", JSON.stringify(done));
      }
    }, [done]);
    const handleLogin = (e) => {
      e.preventDefault();
      if (password === "iwillwin") {
        setAuthed(true);
        if (typeof window !== "undefined") localStorage.setItem("admin-authed", "true");
      }
      setPassword("");
    };
    if (!authed) {
      return /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "max-w-lg w-full space-y-6" }, /* @__PURE__ */ React.createElement("p", { className: "font-mono text-[10px] tracking-widest text-ink-light uppercase" }, "Admin Access"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleLogin, className: "space-y-4" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          placeholder: "Enter password",
          className: "w-full border border-ink/20 rounded px-3 py-2 bg-paper",
          autoFocus: true
        }
      ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "px-4 py-2 border border-ink/30 rounded hover:border-ink/60 transition" }, "Enter")));
    }
    return /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "w-full max-w-3xl space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("p", { className: "font-mono text-[10px] tracking-widest text-ink-light uppercase" }, "Draft Posts (local)"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-ink-light" }, "click to mark done")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col divide-y divide-ink/10 border border-ink/10 rounded" }, entries.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "p-4 text-ink-light text-sm" }, "No drafts found."), entries.map((item) => {
      const isDone = !!done[item.id];
      return /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex items-start gap-3 p-4" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setDone((prev) => ({ ...prev, [item.id]: !isDone })),
          className: `flex-1 text-left transition ${isDone ? "line-through text-ink-light opacity-70" : ""}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "font-mono text-[10px] tracking-widest uppercase text-ink-light mb-1" }, item.timestamp),
        /* @__PURE__ */ React.createElement("div", { className: "text-base md:text-lg leading-relaxed" }, item.text)
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => navigator.clipboard && navigator.clipboard.writeText(item.text),
          className: "text-xs px-2 py-1 border border-ink/20 rounded hover:border-ink/40 transition"
        },
        "Copy"
      ));
    })));
  };
  const Contact = () => /* @__PURE__ */ React.createElement(motion.div, { variants: pageVariants, initial: "initial", animate: "enter", exit: "exit", className: "max-w-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-12" }, /* @__PURE__ */ React.createElement("p", { className: "text-2xl md:text-4xl tracking-tight leading-snug" }, "i am always open to talking about startups, artificial intelligence, product design, or autonomous agents."), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 font-mono text-sm tracking-wide" }, /* @__PURE__ */ React.createElement("a", { href: "mailto:arjunkshah21@gmail.com", target: "_blank", rel: "noopener noreferrer", className: "text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1" }, "arjunkshah21@gmail.com"), /* @__PURE__ */ React.createElement("a", { href: "https://x.com/arjunkshah21", target: "_blank", rel: "noopener noreferrer", className: "text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1" }, "x.com/arjunkshah21"), /* @__PURE__ */ React.createElement("a", { href: "https://github.com/arjunkshah", target: "_blank", rel: "noopener noreferrer", className: "text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1" }, "github.com/arjunkshah"), /* @__PURE__ */ React.createElement("a", { href: "https://gitlab.com/arjunkshah", target: "_blank", rel: "noopener noreferrer", className: "text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1" }, "gitlab.com/arjunkshah"), /* @__PURE__ */ React.createElement("a", { href: "https://www.linkedin.com/in/arjun-k-shah", target: "_blank", rel: "noopener noreferrer", className: "text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1" }, "linkedin.com/in/arjun-k-shah")), /* @__PURE__ */ React.createElement("p", { className: "text-ink-light italic mt-24" }, "signed,", /* @__PURE__ */ React.createElement("br", null), "a.s.")));
  const App = () => {
    const initialPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const [currentPath, setCurrentPath] = useState(initialPath || "/");
    const renderPage = () => {
      const detailMatch = currentPath.match(/^\/work\/([^/]+)$/);
      if (detailMatch) {
        const project = workProjectMap[detailMatch[1]];
        if (project) {
          return /* @__PURE__ */ React.createElement(ProjectDetail, { key: project.slug, project, setPath: changePath });
        }
      }
      switch (currentPath) {
        case "/":
          return /* @__PURE__ */ React.createElement(Home, { key: "home" });
        case "/about":
          return /* @__PURE__ */ React.createElement(About, { key: "about" });
        case "/work":
          return /* @__PURE__ */ React.createElement(Work, { key: "work", setPath: changePath });
        case "/writing":
          return /* @__PURE__ */ React.createElement(Writing, { key: "writing" });
        case "/contact":
          return /* @__PURE__ */ React.createElement(Contact, { key: "contact" });
        case "/admin":
          return /* @__PURE__ */ React.createElement(Admin, { key: "admin" });
        default:
          return /* @__PURE__ */ React.createElement(Home, { key: "home" });
      }
    };
    const changePath = (path) => {
      setCurrentPath(path);
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", path);
      }
    };
    useEffect(() => {
      const onPop = () => {
        setCurrentPath(window.location.pathname || "/");
      };
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen w-full flex flex-col selection:bg-ink selection:text-paper relative" }, /* @__PURE__ */ React.createElement(Navigation, { currentPath, setPath: changePath }), /* @__PURE__ */ React.createElement("main", { className: "flex-grow flex items-center justify-center p-6 md:p-24 lg:p-32 pt-32 md:pt-48 min-h-screen" }, /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, renderPage())), /* @__PURE__ */ React.createElement(AnimatePresence, null, /* @__PURE__ */ React.createElement(JasmineBadge, null)),
    /* @__PURE__ */ React.createElement(CursorParticles, null), /* @__PURE__ */ React.createElement("div", { className: "pointer-events-none fixed inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.02)] z-[-1]" }));
  };
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();

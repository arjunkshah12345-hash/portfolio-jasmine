import { motion } from 'framer-motion';

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

const Work = () => {
  const projects = [
    { year: 'Now', title: 'Loopy', url: 'https://loopy.yachts', desc: 'Autonomous software engineer that researches, plans, builds, fixes, and loops until the product is done.' },
    { year: '2026', title: 'Supercompress', url: 'https://www.supercompress.dev', desc: 'Neural context compression for long-running AI agents.' },
    { year: '2026', title: 'Pincer', url: 'https://trypincer.netlify.app/', desc: 'Chrome extension that modifies page content to support dyslexic users.' },
    { year: 'Last year', title: 'rooted.ai', url: 'https://rooted-ai.vercel.app', desc: 'Stanford GSB LISA project focused on AI-driven natural health exploration.' },
    { year: 'Last year', title: 'ideatr.dev', url: 'https://github.com/arjunkshah/ideatr', desc: 'Clone and recreate any website as a modern React app in seconds.' },
    { year: 'Last year', title: 'tryjasmine.dev', url: 'https://tryjasmine.dev', desc: 'AI frontend design with stronger taste and less slop.' },
    { year: '2025', title: 'NEAT Flappy Bird', url: 'https://github.com/arjunkshah/Vortex21-X.github.io', desc: 'Flappy Bird where AI birds learn to play through evolution.' },
    { year: '2024', title: 'Typing Club Bot', url: 'https://github.com/arjunkshah/Typing-Club-Bot', desc: 'Typing Club automation and practice tooling.' }
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-3xl w-full">
      <motion.p variants={itemVariants} className="font-mono text-[10px] tracking-widest text-ink-light uppercase mb-12">
        03 / Selected Works
      </motion.p>

      <div className="flex flex-col w-full">
        {projects.map((project) => (
          <motion.div 
            key={project.title}
            variants={itemVariants}
            className="group flex flex-col md:flex-row md:items-baseline border-b border-ink/5 py-8 md:py-12 gap-2 md:gap-8 hover:border-ink/20 transition-colors duration-500 cursor-pointer"
          >
            <span className="font-mono text-xs text-ink-light w-16 shrink-0">{project.year}</span>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl md:text-4xl tracking-tight transition-transform duration-500 group-hover:translate-x-2"><a href={project.url} target="_blank" rel="noopener noreferrer">{project.title}</a></h3>
              <p className="text-ink-light text-base md:text-lg max-w-md">{project.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Work;

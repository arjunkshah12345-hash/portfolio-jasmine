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
    { year: 'Now', title: 'tryjasmine.dev', url: 'https://tryjasmine.dev', desc: 'An elite AI frontend engineer and product-level designer. Crafting interfaces without the AI slop.' },
    { year: '2023', title: 'ideatr.dev', url: 'https://ideatr.dev', desc: 'Scaled to 100+ users in months. A platform built for rapid iteration and idea validation.' },
    { year: '2023', title: 'therooted.ai', url: 'https://therooted.ai', desc: 'Winning project at the Stanford GSB LISA startup competition. AI-driven solutions.' }
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
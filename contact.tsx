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

const Contact = () => {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-2xl">
      <motion.p variants={itemVariants} className="font-mono text-[10px] tracking-widest text-ink-light uppercase mb-12">
        05 / Correspondence
      </motion.p>

      <div className="space-y-12">
        <motion.div variants={itemVariants}>
          <p className="text-2xl md:text-4xl tracking-tight leading-snug">
            i am always open to talking about startups, artificial intelligence, or design.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex flex-col gap-4 font-mono text-sm tracking-wide">
            <a href="mailto:arjunkshah21@gmail.com" target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1">arjunkshah21@gmail.com</a>
            <a href="https://x.com/arjunkshah21" target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1">x.com/arjunkshah21</a>
            <a href="https://github.com/arjunkshah" target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ink-light transition-colors w-fit border-b border-ink/20 hover:border-ink/0 pb-1">github.com/arjunkshah</a>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="text-ink-light italic mt-24">
            signed,<br/>
            a.s.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Contact;
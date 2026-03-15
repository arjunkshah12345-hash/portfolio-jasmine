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

const Home = () => {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-2xl">
      <motion.p variants={itemVariants} className="font-mono text-[10px] tracking-widest text-ink-light uppercase mb-12">
        01 / Introduction
      </motion.p>
      
      <div className="space-y-8 text-xl md:text-3xl leading-relaxed md:leading-relaxed font-light tracking-tight">
        <motion.div variants={itemVariants}>
          <p>hello.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <p>i am arjun. i am a 13-year-old developer and founder building software that scales.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <p>i believe in shipping fast, iterating relentlessly, and creating tools that feel crafted. quiet, intentional, and powerful.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <p className="text-ink-light italic text-lg md:text-2xl mt-12">
            currently building tryjasmine.dev — an ai frontend engineer that crafts, rather than codes.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
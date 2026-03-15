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

const About = () => {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-2xl">
      <motion.p variants={itemVariants} className="font-mono text-[10px] tracking-widest text-ink-light uppercase mb-12">
        02 / Trajectory
      </motion.p>

      <div className="space-y-8 text-lg md:text-xl leading-relaxed text-ink/80">
        <motion.div variants={itemVariants}>
          <p>age is just a constraint. i approach engineering and product design with the mindset of a founder who needs to solve real problems, right now.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <p>my journey started with therooted.ai, which went on to win the stanford gsb lisa startup competition. that taught me how to pitch, build, and validate.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="py-8">
            <img 
                src="https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&q=80&w=1200" 
                alt="A minimal, abstract architectural detail in black and white, representing structure and momentum." 
                referrerPolicy="no-referrer"
                className="w-full h-auto aspect-[16/9] object-cover grayscale opacity-80 mix-blend-multiply"
            />
            <p className="font-mono text-[10px] text-ink-light mt-3 tracking-widest uppercase">Fig 1. Momentum over perfection.</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p>after that, i built and scaled ideatr.dev to over 100 active users in just a few months. seeing real people use my software changed how i view the internet.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <p>now, i am focused entirely on the intersection of artificial intelligence and product-level design.</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default About;
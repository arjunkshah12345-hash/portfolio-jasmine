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

const Writing = () => {
  const essays = [
    { date: 'Recent', title: 'Building Jasmine: Why AI UI Needs Taste' },
    { date: 'Archive', title: 'Scaling to 100 Users: Lessons from ideatr.dev' },
    { date: 'Archive', title: 'Winning Stanford GSB LISA at 14' },
    { date: 'Archive', title: 'The Elegance of Shipping Fast' }
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-2xl w-full">
      <motion.p variants={itemVariants} className="font-mono text-[10px] tracking-widest text-ink-light uppercase mb-12">
        04 / Notes & Essays
      </motion.p>

      <div className="flex flex-col gap-8 md:gap-12">
        {essays.map((essay) => (
          <motion.article 
            key={essay.title}
            variants={itemVariants}
            className="flex flex-col gap-2 cursor-pointer group"
          >
            <span className="font-mono text-[10px] tracking-widest text-ink-light uppercase">{essay.date}</span>
            <h3 className="text-xl md:text-2xl tracking-tight group-hover:italic transition-all duration-300">
              {essay.title}
            </h3>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
};

export default Writing;

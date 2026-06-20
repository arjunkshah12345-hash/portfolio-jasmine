import { motion } from 'framer-motion';
import { useState } from 'react';

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
    {
      date: 'Recent',
      title: 'i built supercompress',
      content: [
        'i kept running into the same problem with ai agents.',
        'not the demo problem.',
        'the real problem.',
        'context.',
        'when an agent runs for five minutes, everything looks amazing. when it runs for five hours, everything starts breaking.',
        'it forgets what it already did. it repeats work. it loses the original goal. it starts treating old decisions like new ideas. it burns tokens for no reason.',
        'i saw this while building loopy.',
        'loopy is my autonomous software engineer. the goal is simple: give it an idea, and it researches, plans, builds, tracks tasks, commits code, fixes bugs, and keeps looping until the product is done.',
        'but the longer loopy ran, the more obvious the bottleneck became.',
        'the agent did not need more prompts.',
        'it needed better memory.',
        'so i built supercompress.',
        'supercompress is a neural context compression tool for ai agents.',
        'the goal is not to summarize text into generic bullets. that loses too much signal.',
        'the goal is to compress long context while preserving the parts an agent actually needs to keep working: decisions, constraints, code references, failures, todos, reasoning trails, and important state.',
        'basically, the stuff a human engineer would remember.',
        'the first version was simple. take a long agent context. compress it. feed it back in. see what broke.',
        'a lot broke.',
        'early versions were too aggressive. they saved tokens, but the agent lost important details. then some versions kept too much and were not useful. the hard part was finding the line between compression and memory loss.',
        'eventually, supercompress started working.',
        'it cut token usage by around 65% while retaining about 98.7% of the important information.',
        'that changed the whole system.',
        'loopy became cheaper. it became faster. it stayed on task longer. it stopped dragging around huge messy context windows. it could carry forward the right state instead of the entire conversation.',
        'technically, supercompress is built around signal-preserving compression for agent memory. it is designed for long-running workflows where context keeps growing every loop.',
        'it focuses on preserving things like project goals, implementation decisions, files changed, bugs found, tasks completed, unresolved issues, constraints from the user, and next actions.',
        'that matters because agents are not just chat interfaces anymore.',
        'they are becoming workers.',
        'and workers need memory.',
        'not infinite memory.',
        'useful memory.',
        'that is the difference.',
        'a normal chatbot can forget things and still be fine. but an autonomous coding agent cannot forget why it created a file, what bug it already fixed, or what the user explicitly told it not to do.',
        'that is why i think compression is going to be a core part of agent infrastructure.',
        'everyone is trying to build smarter agents.',
        'but smarter agents with bad memory still fail.',
        'supercompress is my attempt at fixing that layer.',
        'it is live now: trysupercompress.vercel.app',
        'and the code is here: github.com/arjunkshah/supercompress',
        'this started as a problem inside loopy, but it became its own thing.',
        'because the more i build agents, the more i believe this:',
        'the future of agents is not just better models.',
        'it is better systems around the models.',
        'memory. compression. state. feedback loops. execution.',
        'that is what makes an agent actually useful.',
        'supercompress is one piece of that.',
        'and i am done with the first version.'
      ]
    },
    { date: 'Archive', title: 'Building Jasmine: Why AI UI Needs Taste', content: [] },
    { date: 'Archive', title: 'Scaling to 100 Users: Lessons from ideatr.dev' },
    { date: 'Archive', title: 'Winning Stanford GSB LISA at 14' },
    { date: 'Archive', title: 'The Elegance of Shipping Fast' }
  ];

  const [selected, setSelected] = useState(essays[0]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-2xl w-full">
      <motion.p variants={itemVariants} className="font-mono text-[10px] tracking-widest text-ink-light uppercase mb-12">
        04 / Notes & Essays
      </motion.p>

      <div className="flex flex-col gap-8 md:gap-12">
        {essays.map((essay) => (
          <motion.button
            type="button"
            key={essay.title}
            variants={itemVariants}
            onClick={() => setSelected(essay)}
            className={`flex flex-col gap-2 text-left cursor-pointer group ${selected.title === essay.title ? 'opacity-100' : 'opacity-60 hover:opacity-100'} transition-opacity duration-300`}
          >
            <span className="font-mono text-[10px] tracking-widest text-ink-light uppercase">{essay.date}</span>
            <h3 className="text-xl md:text-2xl tracking-tight group-hover:italic transition-all duration-300">
              {essay.title}
            </h3>
          </motion.button>
        ))}
      </div>

      {selected?.content?.length ? (
        <motion.div
          className="mt-10 md:mt-14 space-y-6 text-lg md:text-xl leading-relaxed text-ink/90"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          {selected.content.map((para, idx) => <p key={idx}>{para}</p>)}
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default Writing;

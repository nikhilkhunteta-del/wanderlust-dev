import { Sparkles, Eye, Scale } from "lucide-react";
import { motion } from "framer-motion";

const values = [
  {
    icon: Sparkles,
    title: "Personalized discovery",
    description: "Cities matched to your interests and travel timing.",
  },
  {
    icon: Eye,
    title: "See what makes each place special",
    description: "Highlights, seasonal experiences, itineraries, and local insight.",
  },
  {
    icon: Scale,
    title: "Choose with confidence",
    description: "Compare cities side-by-side before committing.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export const ValuePropositions = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="grid md:grid-cols-3 gap-12 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {values.map((value) => (
            <motion.div
              key={value.title}
              className="text-center group"
              variants={itemVariants}
            >
              <motion.div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <value.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {value.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

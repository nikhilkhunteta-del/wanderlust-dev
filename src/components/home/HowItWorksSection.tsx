import { forwardRef } from "react";
import { MessageSquare, Map, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Share your preferences",
    description: "Answer a few quick questions about your interests, travel style, and timing.",
  },
  {
    icon: Map,
    step: "02",
    title: "Get matched cities",
    description: "We analyze your preferences and suggest three destinations tailored just for you.",
  },
  {
    icon: CalendarDays,
    step: "03",
    title: "Explore and plan",
    description: "Dive into highlights, weather, festivals, and custom itineraries for each city.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export const HowItWorksSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <section ref={ref} className="py-24 md:py-32 bg-card">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three simple steps to finding your perfect destination.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              className="relative"
              variants={cardVariants}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-border"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
                  style={{ transformOrigin: "left" }}
                />
              )}

              <motion.div
                className="relative bg-background rounded-2xl p-8 border border-border/50"
                whileHover={{ borderColor: "hsl(var(--primary) / 0.3)", y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-4xl font-display font-semibold text-muted-foreground/30">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

HowItWorksSection.displayName = "HowItWorksSection";

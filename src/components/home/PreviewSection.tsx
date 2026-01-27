import { motion } from "framer-motion";
import kyotoImage from "@/assets/preview-kyoto.jpg";
import marrakechImage from "@/assets/preview-marrakech.jpg";
import lisbonImage from "@/assets/preview-lisbon.jpg";

const destinations = [
  {
    city: "Kyoto",
    country: "Japan",
    teaser: "Ancient temples meet cherry blossoms in spring",
    image: kyotoImage,
  },
  {
    city: "Marrakech",
    country: "Morocco",
    teaser: "Sensory overload in the heart of the medina",
    image: marrakechImage,
  },
  {
    city: "Lisbon",
    country: "Portugal",
    teaser: "Sunset tiles and vintage trams on cobbled hills",
    image: lisbonImage,
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

export const PreviewSection = () => {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Discover your next adventure
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Here's a glimpse of what your personalized results could look like.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {destinations.map((destination) => (
            <motion.article
              key={destination.city}
              className="group cursor-pointer"
              variants={cardVariants}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                <motion.img
                  src={destination.image}
                  alt={`${destination.city}, ${destination.country}`}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {destination.city}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {destination.country}
                </p>
                <p className="text-muted-foreground text-sm pt-1">
                  {destination.teaser}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

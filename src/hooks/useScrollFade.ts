import { useEffect, useRef } from "react";

/**
 * Applies a fade-in + slide-up animation to child elements
 * when they enter the viewport. Respects prefers-reduced-motion.
 */
export function useScrollFade<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !ref.current) return;

    const children = ref.current.querySelectorAll("[data-scroll-fade]");
    if (children.length === 0) return;

    children.forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
      (el as HTMLElement).style.transform = "translateY(16px)";
      (el as HTMLElement).style.transition = "opacity 0.4s ease, transform 0.4s ease";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    children.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

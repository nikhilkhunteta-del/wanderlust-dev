interface InsiderMissedSectionProps {
  city: string;
  content: string;
}

export const InsiderMissedSection = ({ city, content }: InsiderMissedSectionProps) => {
  if (!content) return null;

  return (
    <section className="mb-14" data-scroll-fade>
      <h2
        className="font-display font-semibold text-foreground mb-5"
        style={{ fontSize: '20px' }}
      >
        What most visitors miss in {city}
      </h2>
      <div
        className="relative rounded-xl border-l-[3px] border-l-[#EA580C] p-6 md:p-8"
        style={{ background: '#FAFAF8' }}
      >
        <span
          className="absolute top-3 left-4 font-serif select-none pointer-events-none"
          style={{ fontSize: '64px', color: 'rgba(234, 88, 12, 0.2)', lineHeight: 1 }}
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <p
          className="relative italic text-muted-foreground mx-auto"
          style={{ fontSize: '16px', lineHeight: 1.8, maxWidth: '680px' }}
        >
          {content}
        </p>
      </div>
    </section>
  );
};

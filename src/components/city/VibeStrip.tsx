interface VibeStripProps {
  tags: string[];
}

export const VibeStrip = ({ tags }: VibeStripProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

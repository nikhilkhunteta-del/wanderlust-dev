interface VibeStripProps {
  tags: string[];
}

export const VibeStrip = ({ tags }: VibeStripProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-4 py-2 rounded-[20px] text-[13px] font-medium"
          style={{ background: '#F3F4F6', color: '#374151' }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

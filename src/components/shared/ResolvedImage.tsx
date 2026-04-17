import { cn } from "@/lib/utils";
import { useResolvedImage } from "@/hooks/useResolvedImage";
import { useImageState } from "@/hooks/useImageState";
import { ResolveImageRequest, ResolvedImage as ResolvedImageType } from "@/types/imageSystem";

interface ResolvedImageProps {
  request: ResolveImageRequest | null;
  alt: string;
  className?: string;
  showAttribution?: boolean;
  fallbackCategory?: string;
  priority?: boolean;
}

export function ResolvedImage({
  request,
  alt,
  className,
  showAttribution = false,
  fallbackCategory,
  priority = false,
}: ResolvedImageProps) {
  const { data: image, isLoading, isError } = useResolvedImage(request, { fallbackCategory });
  const { src, loaded, onLoad, onError } = useImageState(image?.url, image?.smallUrl);

  if (isLoading || !image) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
        <div className="absolute inset-0 backdrop-blur-xl" />
      </div>
    );
  }

  if (isError && !image) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
      )}

      {image.thumbUrl && !loaded && (
        <img
          src={image.thumbUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
          aria-hidden="true"
        />
      )}

      {src && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          style={{ objectPosition: "center 40%" }}
          loading={priority ? "eager" : "lazy"}
          onLoad={onLoad}
          onError={onError}
        />
      )}

      {showAttribution && image.attributionRequired && image.photographer && loaded && (
        <ImageAttribution image={image} />
      )}
    </div>
  );
}

interface ImageAttributionProps {
  image: ResolvedImageType;
}

function ImageAttribution({ image }: ImageAttributionProps) {
  const sourceLabel = image.source === 'unsplash' ? 'Unsplash'
    : image.source === 'pexels' ? 'Pexels'
    : image.source === 'wikimedia' ? 'Wikimedia'
    : image.source === 'google_places' ? 'Google'
    : null;

  if (!sourceLabel || !image.photographer) return null;

  return (
    <a
      href={`${image.sourceUrl || image.photographerUrl}?utm_source=travel_app&utm_medium=referral`}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-2 right-2 text-[10px] text-white/70 hover:text-white bg-black/40 hover:bg-black/60 px-2 py-1 rounded transition-colors backdrop-blur-sm"
    >
      📷 {image.photographer} on {sourceLabel}
    </a>
  );
}

/**
 * Simpler image component for when you already have a ResolvedImage object.
 */
interface DirectResolvedImageProps {
  image: ResolvedImageType | null;
  alt: string;
  className?: string;
  showAttribution?: boolean;
  priority?: boolean;
}

export function DirectResolvedImage({
  image,
  alt,
  className,
  showAttribution = false,
  priority = false,
}: DirectResolvedImageProps) {
  const { src, loaded, onLoad, onError } = useImageState(image?.url, image?.smallUrl);

  if (!image) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
      )}

      {image.thumbUrl && !loaded && (
        <img
          src={image.thumbUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
          aria-hidden="true"
        />
      )}

      {src && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          style={{ objectPosition: "center 40%" }}
          loading={priority ? "eager" : "lazy"}
          onLoad={onLoad}
          onError={onError}
        />
      )}

      {showAttribution && image.attributionRequired && image.photographer && loaded && (
        <ImageAttribution image={image} />
      )}
    </div>
  );
}

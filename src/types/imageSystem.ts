export type ImageType = 'city_hero' | 'attraction' | 'seasonal' | 'neighborhood' | 'category';
export type ImageSource = 'wikimedia' | 'unsplash' | 'pexels' | 'local' | 'pollinations' | 'google_places';

export interface ResolvedImage {
  id: string;
  cacheKey: string;
  imageType: ImageType;
  city: string;
  country: string;
  entityName?: string;
  url: string;
  smallUrl?: string;
  thumbUrl?: string;
  source: ImageSource;
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  attributionRequired: boolean;
  width?: number;
  height?: number;
}

export interface ResolveImageRequest {
  type: ImageType;
  city: string;
  country: string;
  entityName?: string;
  interestTags?: string[];
  month?: string;
}

export interface ResolveImageResponse {
  image: ResolvedImage | null;
  fromCache: boolean;
  error?: string;
}

export interface PrefetchImagesRequest {
  cities: Array<{
    city: string;
    country: string;
  }>;
  userInterests: string[];
}

export interface PrefetchImagesResponse {
  cached: number;
  errors: number;
  message: string;
}

export interface ImagePackRequest {
  city: string;
  country: string;
}

export interface ImagePack {
  heroes: ResolvedImage[];
  categories: Record<string, ResolvedImage>;
}

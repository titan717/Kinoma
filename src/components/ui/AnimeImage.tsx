import React, { useState } from 'react';
import { DEFAULT_POSTER } from '../../types';

export interface AnimeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src?: string;
  alt: string;
  aspectRatio?: 'poster' | 'landscape' | 'square' | 'custom';
  fallbackSrc?: string;
  className?: string;
  imageClassName?: string;
  loading?: 'lazy' | 'eager';
}

const aspectClasses = {
  poster: 'aspect-[2/3]',
  landscape: 'aspect-video',
  square: 'aspect-square',
  custom: '',
};

export function AnimeImage({
  src,
  alt,
  aspectRatio = 'poster',
  fallbackSrc = DEFAULT_POSTER,
  className = '',
  imageClassName = '',
  loading = 'lazy',
  ...props
}: AnimeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const displaySrc = hasError || !src ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden bg-[#12141c] ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#161824] animate-pulse" />
      )}

      <img
        src={displaySrc}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${imageClassName}`}
        {...props}
      />
    </div>
  );
}

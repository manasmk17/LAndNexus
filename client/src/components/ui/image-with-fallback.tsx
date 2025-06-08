import { useState, useEffect, ReactNode } from 'react';
import { ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number | string;
  height?: number | string;
  fallbackContent?: ReactNode;
}

/**
 * A component that renders an image with a fallback when the image fails to load
 * or when the src is null or undefined.
 */
export function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackClassName = "flex items-center justify-center bg-gray-100 rounded-md",
  width,
  height,
  fallbackContent,
}: ImageWithFallbackProps) {
  const [error, setError] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | null | undefined>(src);

  // If src changes, reset error state and set new src
  useEffect(() => {
    setError(false);
    setImgSrc(src);
  }, [src]);

  // Handle image load error
  const handleError = () => {
    setError(true);
  };

  // Handle missing src or error loading image
  if (!imgSrc || error) {
    return (
      <div 
        className={`${fallbackClassName} ${className}`}
        style={{ width: width || "100%", height: height || "200px" }}
      >
        {fallbackContent || <ImageIcon className="h-10 w-10 text-gray-400" />}
      </div>
    );
  }

  // Ensure URLs are absolute (convert relative URLs if needed)
  const fullSrc = imgSrc.startsWith('http') || imgSrc.startsWith('/') 
    ? imgSrc 
    : `/${imgSrc}`;

  return (
    <img
      src={fullSrc}
      alt={alt}
      className={className}
      onError={handleError}
      width={width}
      height={height}
    />
  );
}
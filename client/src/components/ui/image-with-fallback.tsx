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
    // Log with source info to help debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Image load error for: ${imgSrc}, using placeholder`);
    }
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

  // Ensure URLs are absolute and properly formatted
  // This handles common edge cases that can cause image loading errors
  const getProperImageUrl = (src: string): string => {
    try {
      // Check for empty string - this can cause console errors
      if (!src.trim()) {
        throw new Error('Empty image URL');
      }
      
      // Already absolute URL (http/https)
      if (src.startsWith('http')) {
        // Validate it's a proper URL 
        try {
          new URL(src);
          return src;
        } catch (e) {
          throw new Error(`Invalid URL format: ${src}`);
        }
      }
      
      // Already starts with slash (relative to root)
      if (src.startsWith('/')) {
        // Remove any duplicate slashes
        return '/' + src.replace(/^\/+/, '');
      }
      
      // Fix data URLs if they're missing the proper prefix
      if (src.startsWith('data:image')) {
        if (!src.includes(';base64,')) {
          return `data:image/jpeg;base64,${src.replace('data:image/', '')}`;
        }
        return src;
      }
      
      // Other cases - assume relative path
      return `/${src}`;
    } catch (error) {
      // If we catch any errors, log them and trigger the fallback
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`ImageWithFallback - URL processing error:`, error);
      }
      setError(true);
      return ''; // Return empty string that will trigger fallback
    }
  };
  
  // Only process the URL if we're not already in an error state
  const fullSrc = !error ? getProperImageUrl(imgSrc) : '';

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
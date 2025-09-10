"use client";

import { cn } from "lib/utils";
import { Globe } from "lucide-react";
import { useState } from "react";

interface ApplicationIconProps {
  domainUrl: string;
  apiName: string;
  className?: string;
}

export function ApplicationIcon({
  domainUrl,
  apiName,
  className,
}: ApplicationIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Get Brandfetch client ID from environment or use a default
  const brandfetchClientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;

  // Construct the Brandfetch URL with fallback to Google favicons
  const brandfetchUrl = `https://cdn.brandfetch.io/${encodeURIComponent(domainUrl)}?c=${brandfetchClientId}&fallback=https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainUrl)}`;

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // If image failed to load, show fallback icon
  if (imageError) {
    return <Globe className={cn("size-4 text-muted-foreground", className)} />;
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {imageLoading && (
        <div className="size-4 bg-muted rounded animate-pulse" />
      )}
      <img
        src={brandfetchUrl}
        alt={`${apiName} logo`}
        className={cn(
          "size-8 rounded object-contain",
          imageLoading ? "opacity-0 absolute" : "opacity-100",
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
}

/**
 * Utility functions for handling icon URLs
 */

/**
 * Gets the Brandfetch CDN URL for an icon with fallback to Apigene icon
 * @param iconUrl - The original icon URL
 * @returns The Brandfetch CDN URL or fallback to Apigene icon
 */
export const getIconUrl = (iconUrl?: string): string => {
  // If no icon URL provided, use Apigene icon as fallback
  if (!iconUrl || iconUrl.trim() === "") {
    return "/assets/icons/apigene-icon.svg";
  }

  // Use Brandfetch CDN for the provided icon URL
  const brandfetchClientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;
  return `https://cdn.brandfetch.io/${encodeURIComponent(iconUrl)}/w/20/h/20?c=${brandfetchClientId}`;
};

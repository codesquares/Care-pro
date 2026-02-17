/**
 * Avatar utility functions for consistent user representation across the app
 */

/**
 * Extract initials from a full name
 * @param {string} name - Full name (e.g., "Oluwasegun Idowu")
 * @returns {string} User initials (e.g., "OI"), max 2 characters
 * 
 * Examples:
 * - "Oluwasegun Idowu" → "OI"
 * - "John" → "J"
 * - "John Paul Smith" → "JP"
 * - "" → "NA"
 * - null/undefined → "NA"
 */
export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "NA";
  
  const names = name.trim().split(" ").filter(Boolean);
  if (names.length === 0) return "NA";
  
  const initials = names.map((n) => n[0].toUpperCase()).join("");
  
  return initials.slice(0, 2);
};

/**
 * Generate a consistent background color for avatar initials based on name
 * @param {string} name - User's full name
 * @returns {string} Hex color code
 */
export const getAvatarColor = (name) => {
  const colors = [
    '#667eea', // Purple
    '#00B4A6', // Teal
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f97316', // Orange
    '#8b5cf6', // Violet
  ];
  
  if (!name) return colors[0];
  
  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

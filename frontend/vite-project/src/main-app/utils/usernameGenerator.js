/**
 * Centralized username generation utility
 * Generates usernames in the format: firstName + emailPrefix + year + hour
 * Example: "olaol2500" (firstName: ola, email: ola@gmail.com, joined: 2025 at 00:XX)
 */

/**
 * Generates a unique username based on user data
 * @param {string} firstName - User's first name
 * @param {string} email - User's email address
 * @param {string|Date} joinDate - User's join date (memberSince or createdAt)
 * @returns {string} Generated username
 */
export const generateUsername = (firstName, email, joinDate) => {
  try {
    // Validate inputs
    if (!firstName || !email || !joinDate) {
      console.warn('Missing required data for username generation:', { firstName, email, joinDate });
      return generateFallbackUsername();
    }

    // Clean and format firstName
    const cleanFirstName = firstName.toLowerCase().trim();
    if (cleanFirstName.length === 0) {
      console.warn('Invalid firstName for username generation');
      return generateFallbackUsername();
    }

    // Extract first 2 letters from email
    const emailPrefix = extractEmailPrefix(email);
    if (!emailPrefix) {
      console.warn('Invalid email for username generation:', email);
      return generateFallbackUsername();
    }

    // Parse join date and extract year/hour
    const dateInfo = extractDateInfo(joinDate);
    if (!dateInfo) {
      console.warn('Invalid join date for username generation:', joinDate);
      return generateFallbackUsername();
    }

    // Generate username: firstName + emailPrefix + year + hour
    const username = `${cleanFirstName}${emailPrefix}${dateInfo.year}${dateInfo.hour}`;
    
    return username;

  } catch (error) {
    console.error('Error generating username:', error);
    return generateFallbackUsername();
  }
};

/**
 * Extracts the first 2 letters from email address
 * @param {string} email - Email address
 * @returns {string|null} First 2 letters or null if invalid
 */
const extractEmailPrefix = (email) => {
  if (typeof email !== 'string' || !email.includes('@')) {
    return null;
  }

  const localPart = email.split('@')[0];
  if (localPart.length < 2) {
    return null;
  }

  return localPart.slice(0, 2).toLowerCase();
};

/**
 * Extracts year (last 2 digits) and hour from join date
 * @param {string|Date} joinDate - Join date
 * @returns {object|null} Object with year and hour or null if invalid
 */
const extractDateInfo = (joinDate) => {
  try {
    let date;

    // Handle different date formats
    if (joinDate instanceof Date) {
      date = joinDate;
    } else if (typeof joinDate === 'string') {
      date = new Date(joinDate);
    } else {
      return null;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Get last 2 digits of year (e.g., 2025 -> 25)
    const fullYear = date.getFullYear();
    const year = String(fullYear).slice(-2);

    // Get hour in 24-hour format (padded with 0 if needed)
    const hour = String(date.getHours()).padStart(2, '0');

    return { year, hour };

  } catch (error) {
    console.error('Error extracting date info:', error);
    return null;
  }
};

/**
 * Generates a fallback username when main generation fails
 * @returns {string} Fallback username
 */
const generateFallbackUsername = () => {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `guest${timestamp}`;
};

/**
 * Validates if a username meets the expected format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid format
 */
export const validateUsername = (username) => {
  if (typeof username !== 'string' || username.length < 6) {
    return false;
  }

  // Check if it's a fallback username
  if (username.startsWith('guest')) {
    return username.length === 11; // guest + 6 digits
  }

  // Check if it matches the expected format (letters + 4 digits at the end)
  const regex = /^[a-z]+[a-z]{2}\d{4}$/;
  return regex.test(username);
};

export default generateUsername;

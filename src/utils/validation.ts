/**
 * Validate email address format
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate password strength
 * Requirements: 
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export const isStrongPassword = (password: string): boolean => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers;
};

/**
 * Check if password and confirmation match
 */
export const passwordsMatch = (password: string, confirmation: string): boolean => {
  return password === confirmation;
};

/**
 * Get password strength feedback
 */
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string;
} => {
  if (!password) {
    return { score: 0, feedback: 'Enter a password' };
  }
  
  let score = 0;
  let feedback = '';
  
  // Length check
  if (password.length < 8) {
    feedback = 'Password is too short (minimum 8 characters)';
  } else {
    score += 1;
  }
  
  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Feedback based on score
  if (score === 2) {
    feedback = 'Weak - add uppercase, numbers, or special characters';
  } else if (score === 3) {
    feedback = 'Medium - add more variety for stronger password';
  } else if (score === 4) {
    feedback = 'Strong password';
  } else if (score === 5) {
    feedback = 'Very strong password';
  }
  
  return { score, feedback };
};

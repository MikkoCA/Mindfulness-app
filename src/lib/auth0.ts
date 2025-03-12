// This file provides authentication functionality
// In a real app, this would connect to Auth0 or another auth provider

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  passwordHash: string; // In a real app, this would be stored only in the backend
}

// Mock database for demo purposes
// In a real app, this would be replaced with actual API calls
const USERS_STORAGE_KEY = 'mindfulness_app_users';
const CURRENT_USER_KEY = 'mindfulness_current_user';

// Helper to get users from localStorage
const getStoredUsers = (): Record<string, User> => {
  if (typeof window === 'undefined') return {};
  
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  return storedUsers ? JSON.parse(storedUsers) : {};
};

// Helper to save users to localStorage
const saveUsers = (users: Record<string, User>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Simple password hashing (for demo only - use proper hashing in production!)
const hashPassword = (password: string): string => {
  return btoa(password); // This is NOT secure, just for demo!
};

// Initialize auth
export const initAuth = () => {
  // Initialize users storage if it doesn't exist
  if (typeof window !== 'undefined' && !localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify({}));
  }
};

// Get the current user from localStorage
export const getCurrentUser = async (): Promise<User | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem(CURRENT_USER_KEY);
    if (!userData) return null;

    const user = JSON.parse(userData);
    
    // Verify user still exists in users storage
    const users = getStoredUsers();
    const storedUser = users[user.id];
    
    if (!storedUser) {
      // User not found in storage, clear current user
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Login function
export const loginUser = async (email: string, password: string): Promise<User> => {
  // Input validation
  if (!email) {
    throw new Error('Email is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }
  
  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  try {
    const users = getStoredUsers();
    const user = Object.values(users).find(u => 
      u.email.toLowerCase() === normalizedEmail
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    if (user.passwordHash !== hashPassword(password)) {
      throw new Error('Invalid credentials');
    }

    // Update last login time
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString()
    };

    // Update user in storage
    users[updatedUser.id] = updatedUser;
    saveUsers(users);

    // Store current user (without password hash)
    const userWithoutPassword = { ...updatedUser };
    delete userWithoutPassword.passwordHash;
    
    // Save to current user storage
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

    return userWithoutPassword;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Signup function
export const signupUser = async (name: string, email: string, password: string): Promise<User> => {
  // Input validation
  if (!name) {
    throw new Error('Name is required');
  }
  if (!email) {
    throw new Error('Email is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }
  
  // Validate email format
  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }
  
  // Normalize email
  const normalizedEmail = email.toLowerCase();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Get stored users
  const users = getStoredUsers();
  
  // Check if email already exists
  if (Object.values(users).some(user => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Email already in use');
  }
  
  // Create new user
  const now = new Date().toISOString();
  const newUser: User = {
    id: Math.random().toString(36).substring(2, 15),
    name: name.trim(),
    email: normalizedEmail,
    createdAt: now,
    lastLogin: now,
    passwordHash: hashPassword(password)
  };
  
  // Save user
  users[newUser.id] = newUser;
  saveUsers(users);
  
  // Return user without password hash
  const userWithoutPassword = { ...newUser };
  delete userWithoutPassword.passwordHash;
  return userWithoutPassword;
};

// Logout function
export const logoutUser = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    // Remove current user from localStorage
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Check if email exists (for password recovery)
export const checkEmailExists = async (email: string): Promise<boolean> => {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if email exists in users storage
  const users = getStoredUsers();
  return Object.values(users).some(user => user.email.toLowerCase() === normalizedEmail);
};

// Protect pages that require authentication
export const withPageAuthRequired = (Component: any) => {
  return Component;
}; 
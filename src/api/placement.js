// api.js - Frontend API Service for Placement Tracker
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/placement';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================================================
// PROFILE API
// ============================================================================

export const profileAPI = {
  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise} Profile data
   */
  getProfile: async (userId) => {
    return apiCall(`/profile/${userId}`);
  },

  /**
   * Create or update user profile
   * @param {object} profileData - Profile data including userId
   * @returns {Promise} Updated profile
   */
  saveProfile: async (profileData) => {
    return apiCall('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },
};

// ============================================================================
// OFF-CAMPUS APPLICATIONS API
// ============================================================================

export const offCampusAPI = {
  /**
   * Get all off-campus applications for a user
   * @param {string} userId - User ID
   * @returns {Promise} Array of applications
   */
  getAll: async (userId) => {
    return apiCall(`/off-campus/${userId}`);
  },

  /**
   * Create new off-campus application
   * @param {object} applicationData - Application data including userId
   * @returns {Promise} Created application
   */
  create: async (applicationData) => {
    return apiCall('/off-campus', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  /**
   * Update off-campus application
   * @param {string} id - Application ID (MongoDB _id)
   * @param {object} applicationData - Updated application data
   * @returns {Promise} Updated application
   */
  update: async (id, applicationData) => {
    return apiCall(`/off-campus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData),
    });
  },

  /**
   * Delete off-campus application
   * @param {string} id - Application ID (MongoDB _id)
   * @returns {Promise} Success message
   */
  delete: async (id) => {
    return apiCall(`/off-campus/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// ON-CAMPUS APPLICATIONS API
// ============================================================================

export const onCampusAPI = {
  /**
   * Get all on-campus applications for a user
   * @param {string} userId - User ID
   * @returns {Promise} Array of applications
   */
  getAll: async (userId) => {
    return apiCall(`/on-campus/${userId}`);
  },

  /**
   * Create new on-campus application
   * @param {object} applicationData - Application data including userId
   * @returns {Promise} Created application
   */
  create: async (applicationData) => {
    return apiCall('/on-campus', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  /**
   * Update on-campus application
   * @param {string} id - Application ID (MongoDB _id)
   * @param {object} applicationData - Updated application data
   * @returns {Promise} Updated application
   */
  update: async (id, applicationData) => {
    return apiCall(`/on-campus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData),
    });
  },

  /**
   * Delete on-campus application
   * @param {string} id - Application ID (MongoDB _id)
   * @returns {Promise} Success message
   */
  delete: async (id) => {
    return apiCall(`/on-campus/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// COMPANY DRIVES API
// ============================================================================

export const companyDrivesAPI = {
  /**
   * Get all company drives for a user
   * @param {string} userId - User ID
   * @returns {Promise} Array of company drives
   */
  getAll: async (userId) => {
    return apiCall(`/company-drives/${userId}`);
  },

  /**
   * Create new company drive
   * @param {object} driveData - Drive data including userId
   * @returns {Promise} Created drive
   */
  create: async (driveData) => {
    return apiCall('/company-drives', {
      method: 'POST',
      body: JSON.stringify(driveData),
    });
  },

  /**
   * Update company drive
   * @param {string} id - Drive ID (MongoDB _id)
   * @param {object} driveData - Updated drive data
   * @returns {Promise} Updated drive
   */
  update: async (id, driveData) => {
    return apiCall(`/company-drives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driveData),
    });
  },

  /**
   * Delete company drive
   * @param {string} id - Drive ID (MongoDB _id)
   * @returns {Promise} Success message
   */
  delete: async (id) => {
    return apiCall(`/company-drives/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// ANALYTICS API
// ============================================================================

export const analyticsAPI = {
  /**
   * Get analytics for a user
   * @param {string} userId - User ID
   * @returns {Promise} Analytics data
   */
  getAnalytics: async (userId) => {
    return apiCall(`/analytics/${userId}`);
  },
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
Example usage in React component:

import { profileAPI, offCampusAPI, onCampusAPI, companyDrivesAPI, analyticsAPI } from './api';

// In your component
const loadUserData = async (userId) => {
  try {
    // Load profile
    const profile = await profileAPI.getProfile(userId);
    
    // Load applications
    const offCampusApps = await offCampusAPI.getAll(userId);
    const onCampusApps = await onCampusAPI.getAll(userId);
    const companyDrives = await companyDrivesAPI.getAll(userId);
    
    // Load analytics
    const analytics = await analyticsAPI.getAnalytics(userId);
    
    // Set state with loaded data
    setProfile(profile);
    setOffCampusApps(offCampusApps);
    setOnCampusApps(onCampusApps);
    setCompanyDrives(companyDrives);
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

// Create new application
const handleAddApplication = async (applicationData) => {
  try {
    const newApp = await offCampusAPI.create({
      ...applicationData,
      userId: currentUserId
    });
    setOffCampusApps([...offCampusApps, newApp]);
  } catch (error) {
    console.error('Error adding application:', error);
  }
};

// Update application
const handleUpdateApplication = async (id, updates) => {
  try {
    const updated = await offCampusAPI.update(id, updates);
    setOffCampusApps(offCampusApps.map(app => 
      app._id === id ? updated : app
    ));
  } catch (error) {
    console.error('Error updating application:', error);
  }
};

// Delete application
const handleDeleteApplication = async (id) => {
  try {
    await offCampusAPI.delete(id);
    setOffCampusApps(offCampusApps.filter(app => app._id !== id));
  } catch (error) {
    console.error('Error deleting application:', error);
  }
};
*/
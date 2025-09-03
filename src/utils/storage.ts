import { User } from "@/types";
import { apiService } from "@/services/api";

// POD name extraction and storage from URL
export const extractPodNameFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (id && id.startsWith('POD-')) {
    const podName = id.substring(4); // Remove 'POD-' prefix
    localStorage.setItem('qikpod_pod_name', podName);
    return podName;
  }
  
  return null;
};

export const getPodName = (): string | null => {
  return localStorage.getItem('qikpod_pod_name');
};

export const clearPodName = (): void => {
  localStorage.removeItem('qikpod_pod_name');
};

// Legacy POD extraction (keeping for compatibility)
export const extractPodFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (id && id.startsWith('POD-')) {
    const podValue = id.substring(4); // Remove 'POD-' prefix
    localStorage.setItem('qikpod_pod_value', podValue);
    return podValue;
  }
  
  return null;
};

export const getPodValue = (): string | null => {
  return localStorage.getItem('qikpod_pod_value');
};

export const clearPodValue = (): void => {
  localStorage.removeItem('qikpod_pod_value');
};

// User data storage
export const saveUserData = (user: User): void => {
  localStorage.setItem('qikpod_user', JSON.stringify(user));
};

export const setUserData = saveUserData; // Alias for consistency

export const getUserData = (): User | null => {
  const userData = localStorage.getItem('qikpod_user');
  return userData ? JSON.parse(userData) : null;
};

export const clearUserData = (): void => {
  localStorage.removeItem('qikpod_user');
};

export const isLoggedIn = (): boolean => {
  return getUserData() !== null;
};

// Location storage
export const saveLastLocation = (locationName: string): void => {
  localStorage.setItem('qikpod_last_location', locationName);
};

export const getLastLocation = (): string | null => {
  return localStorage.getItem('qikpod_last_location');
};

// Location ID storage
export const saveLocationId = (locationId: string): void => {
  localStorage.setItem('current_location_id', locationId);
};

export const getLocationId = (): string | null => {
  return localStorage.getItem('current_location_id');
};

// Location name storage
export const saveLocationName = (locationName: string): void => {
  localStorage.setItem('current_location_name', locationName);
};

export const getLocationName = (): string | null => {
  return localStorage.getItem('current_location_name');
};

// Old passcode storage
export const saveOldPasscode = (passcode: string): void => {
  localStorage.setItem('user_old_passcode', passcode);
};

export const getOldPasscode = (): string | null => {
  return localStorage.getItem('user_old_passcode');
};

// Refresh user data from API
export const refreshUserData = async (): Promise<User | null> => {
  try {
    const currentUser = getUserData();
    if (!currentUser) return null;

    const updatedUserData = await apiService.getUserById(currentUser.id.toString());
    if (updatedUserData) {
      const refreshedUser: User = {
        id: updatedUserData.id,
        user_name: updatedUserData.user_name,
        user_phone: updatedUserData.user_phone,
        user_email: updatedUserData.user_email,
        user_address: updatedUserData.user_address,
        user_type: updatedUserData.user_type,
        user_flatno: updatedUserData.user_flatno,
        user_dropcode: updatedUserData.user_dropcode,
        user_pickupcode: updatedUserData.user_pickupcode,
        user_credit_limit: updatedUserData.user_credit_limit,
        user_credit_used: updatedUserData.user_credit_used,
        status: updatedUserData.status,
        created_at: updatedUserData.created_at,
        updated_at: updatedUserData.updated_at,
      };
      
      saveUserData(refreshedUser);
      return refreshedUser;
    }
    return currentUser;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return getUserData(); // Return cached data if refresh fails
  }
};
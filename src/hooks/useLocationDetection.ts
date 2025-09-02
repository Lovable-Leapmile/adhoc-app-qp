import { useState, useEffect } from "react";
import { apiService } from "@/services/api";

export function useLocationDetection(userId: number | undefined, locationId: string | null) {
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  useEffect(() => {
    const checkLocation = async () => {
      if (!userId || !locationId) return;

      // Check if we've already shown the popup for this user-location combination
      const popupKey = `location_popup_shown_${userId}_${locationId}`;
      const alreadyShown = localStorage.getItem(popupKey);
      
      if (alreadyShown) return;

      try {
        const userExistsAtLocation = await apiService.checkUserAtLocation(userId, locationId);
        if (!userExistsAtLocation) {
          setShowLocationPopup(true);
        }
      } catch (error) {
        console.error('Error checking user location:', error);
      }
    };

    checkLocation();
  }, [userId, locationId]);

  const closeLocationPopup = () => {
    setShowLocationPopup(false);
    // Mark this popup as shown for this user-location combination
    if (userId && locationId) {
      const popupKey = `location_popup_shown_${userId}_${locationId}`;
      localStorage.setItem(popupKey, 'true');
    }
  };

  return {
    showLocationPopup,
    closeLocationPopup
  };
}
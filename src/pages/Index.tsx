import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, extractPodNameFromUrl } from "@/utils/storage";
import { apiService } from "@/services/api";
import Login from "./Login";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract pod name from URL on page load
    const podName = extractPodNameFromUrl();
    
    if (podName) {
      // Call API to get pod info and store location_id
      apiService.getPodInfo(podName)
        .then((podInfo) => {
          localStorage.setItem('current_location_id', podInfo.location_id);
        })
        .catch((error) => {
          console.error('Failed to fetch pod info:', error);
        });
    }

    // Check if user is logged in and redirect accordingly
    if (isLoggedIn()) {
      const userData = JSON.parse(localStorage.getItem('qikpod_user') || '{}');
      switch (userData.user_type) {
        case 'SiteAdmin':
          navigate('/site-admin-dashboard');
          break;
        case 'Customer':
          navigate('/user-dashboard');
          break;
        case 'SiteSecurity':
          navigate('/site-security-dashboard');
          break;
        default:
          navigate('/login');
      }
    }
  }, [navigate]);

  // Show login page directly instead of redirecting
  return <Login />;
};

export default Index;

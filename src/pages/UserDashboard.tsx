import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Package, Clock, ChevronRight } from "lucide-react";
import { apiService, UserLocation } from "@/services/api";
import { getUserData, isLoggedIn, getPodName, getLocationId, saveLastLocation, saveLocationId } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";
import { LocationDetectionPopup } from "@/components/LocationDetectionPopup";
import { useLocationDetection } from "@/hooks/useLocationDetection";
export interface HistoryReservation {
  id: string;
  reservation_status: string;
  reservation_type?: string;
  drop_code?: string;
  pickup_code?: string;
  package_description?: string;
  created_at: string;
  pod_name: string;
  created_by_name?: string;
  reservation_awbno?: string;
  location_name?: string;
}
export default function UserDashboard() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const user = getUserData();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [historyReservations, setHistoryReservations] = useState<HistoryReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [activeTab, setActiveTab] = useState('locations');

  // Location detection
  const currentLocationId = localStorage.getItem('current_location_id');
  const {
    showLocationPopup,
    closeLocationPopup
  } = useLocationDetection(user?.id, currentLocationId);
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (user?.user_type !== 'Customer' && user?.user_type !== 'User') {
      navigate('/login');
      return;
    }
    initializeData();
  }, [navigate]);
  const initializeData = async () => {
    const podName = getPodName();
    if (podName) {
      try {
        await apiService.getPodInfo(podName);
        const locationId = getLocationId();
        if (locationId) {
          await apiService.getLocationInfo(locationId);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    }
    loadUserLocations();
  };
  const loadUserLocations = async () => {
    if (!user) return;
    try {
      setLoadingLocations(true);
      const userLocations = await apiService.getUserLocations(user.id);
      setLocations(userLocations);
    } catch (error) {
      console.error('Error loading user locations:', error);
      toast({
        title: "Error",
        description: "Failed to load your locations",
        variant: "destructive"
      });
    } finally {
      setLoadingLocations(false);
    }
  };
  const loadHistoryReservations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const locationId = localStorage.getItem('current_location_id');
      if (!locationId) {
        console.log('No location_id found, skipping history load');
        setHistoryReservations([]);
        return;
      }
      const authToken = localStorage.getItem('auth_token');
      const authorization = authToken ? `Bearer ${authToken}` : 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkxMTYyMDE1OX0.RMEW55tHQ95GVap8ChrGdPRbuVxef4Shf0NRddNgGJo';
      const response = await fetch(`https://stagingv3.leapmile.com/podcore/adhoc/reservations/?location_id=${locationId}&user_phone=${user.user_phone}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': authorization
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch history reservations');
      }
      const data = await response.json();
      const reservations = data.records || [];
      setHistoryReservations(reservations.map((record: any) => ({
        id: String(record.id),
        reservation_type: record.reservation_type,
        reservation_status: record.reservation_status,
        pod_name: record.pod_name,
        created_at: record.created_at,
        package_description: record.package_description,
        drop_code: record.drop_code,
        pickup_code: record.pickup_code,
        created_by_name: record.created_by_name,
        reservation_awbno: record.reservation_awbno,
        location_name: record.location_name
      })));
    } catch (error) {
      console.error('Error loading history reservations:', error);
      toast({
        title: "Error",
        description: "Failed to load reservation history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCreateReservation = async () => {
    const locationId = getLocationId();
    if (!locationId) {
      toast({
        title: "Error",
        description: "No location selected. Please select a location first.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const hasFreeDoor = await apiService.checkFreeDoor(locationId);
      if (hasFreeDoor) {
        navigate('/reservation');
      } else {
        toast({
          title: "No doors available",
          description: "No doors available at this location.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking door availability:', error);
      toast({
        title: "No doors available",
        description: "No doors available.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleLocationSelect = (location: UserLocation) => {
    saveLastLocation(location.location_name);
    saveLocationId(location.location_id.toString());
    toast({
      title: "Location Selected",
      description: `${location.location_name} selected successfully`
    });
  };
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'history') {
      loadHistoryReservations();
    }
  };
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  return <div className="min-h-screen bg-background my-[16px]">
      {/* Create Reservation Button */}
      

      {/* User Information Cards */}
      <div className="max-w-md mx-auto px-[14px] mb-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Drop Code</p>
            <p className="text-lg font-semibold text-foreground">
              {user?.user_dropcode || 'N/A'}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">New Passcode</p>
            <p className="text-lg font-semibold text-foreground">
              {user?.user_pickupcode || 'N/A'}
            </p>
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
            <p className="text-lg font-semibold text-green-600">
              {user?.user_credit_limit ? Number(user.user_credit_limit) - Number(user.user_credit_used || 0) : 0}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Old Passcode</p>
            <p className="text-lg font-semibold text-foreground">
              ****
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-[14px]">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="locations" className="space-y-4 mt-6">
            {loadingLocations ? <div className="space-y-3">
                {[1, 2, 3].map(i => <Card key={i} className="p-4 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </Card>)}
              </div> : locations.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Locations</p>
                <p className="text-sm">Add locations by scanning QR codes</p>
              </div> : <div className="space-y-3">
                {locations.map(location => <Card key={location.id} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => handleLocationSelect(location)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{location.location_name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{location.location_address}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">PIN: {location.location_pincode}</span>
                            <span className={`text-xs font-medium ${location.status.toLowerCase() === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {location.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Card>)}
              </div>}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            {loading ? <div className="text-center py-8">Loading...</div> : historyReservations.length > 0 ? <div className="space-y-4">
                {historyReservations.map(reservation => <Card key={reservation.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {reservation.pod_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {reservation.reservation_awbno || 'No AWB'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(reservation.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${reservation.reservation_status === 'PickupCompleted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {reservation.reservation_status}
                        </span>
                      </div>
                    </div>
                  </Card>)}
              </div> : <div className="text-center py-12 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No History</p>
                <p className="text-sm">Your reservation history will appear here</p>
              </div>}
          </TabsContent>
        </Tabs>
      </div>

      {/* Location Detection Popup */}
      <LocationDetectionPopup isOpen={showLocationPopup} onClose={closeLocationPopup} userId={user?.id || 0} locationId={currentLocationId || ""} />
    </div>;
}
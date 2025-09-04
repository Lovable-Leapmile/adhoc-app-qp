import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { isLoggedIn } from "@/utils/storage";
import qikpodLogo from "@/assets/qikpod-logo.png";

interface PodDetail {
  id: string;
  pod_name: string;
  pod_access_code: string;
  pod_numtotaldoors: number;
  pod_status: string;
  location_id: string;
}

interface Door {
  door_number: number;
  door_availability: string;
  door_status: string;
  door_access_code: string;
}

export default function PodDoorsOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const podId = searchParams.get('pod_id');
  const locationId = searchParams.get('location_id');

  const [podDetails, setPodDetails] = useState<PodDetail | null>(null);
  const [doors, setDoors] = useState<Door[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    if (!podId || !locationId) {
      toast.error("Missing pod ID or location ID");
      navigate('/admin-dashboard');
      return;
    }

    loadPodData();
  }, [podId, locationId, navigate]);

  const loadPodData = async () => {
    if (!podId || !locationId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Load pod details and doors in parallel
      const [podData, doorsData] = await Promise.all([
        apiService.getPodDetails(podId, locationId),
        apiService.getPodDoors(podId)
      ]);

      setPodDetails(podData);
      setDoors(doorsData);
    } catch (error) {
      console.error("Error loading pod data:", error);
      setError("Failed to load pod information");
      toast.error("Failed to load pod information");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !podDetails) {
    return (
      <div className="min-h-screen bg-background my-[16px]">
        <div className="max-w-md mx-auto px-[14px]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/admin-dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Pod Doors Overview</h1>
          </div>

          {/* Error Display */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error || "Pod not found"}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={loadPodData}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background my-[16px]">
      <div className="max-w-md mx-auto px-[14px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin-dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Pod Doors Overview</h1>
        </div>

        {/* Pod Details Section */}
        <Card className="p-4 mb-6">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Pod Name</p>
              <p className="font-semibold text-foreground">{podDetails.pod_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Access Code</p>
              <p className="font-semibold text-foreground">{podDetails.pod_access_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Doors</p>
              <p className="font-semibold text-foreground">{podDetails.pod_numtotaldoors}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                podDetails.pod_status === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : podDetails.pod_status === 'occupied' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {podDetails.pod_status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </Card>

        {/* Door Selection Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Select the door to get RTO access Code
          </h2>

          {/* Pod Structure Container */}
          <div className="w-[350px] mx-auto bg-[#fbe55b] rounded-lg p-6 shadow-lg">
            {/* QikPod Logo */}
            <div className="text-center mb-6">
              <img 
                src={qikpodLogo} 
                alt="QikPod Logo" 
                className="h-8 mx-auto"
              />
            </div>

            {/* Doors List */}
            <div className="space-y-3">
              {doors.length > 0 ? (
                doors.map((door) => (
                  <div
                    key={door.door_number}
                    className="bg-white/80 rounded-lg p-4 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          Door -- {door.door_number}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            door.door_availability === 'available' || door.door_status === 'free' 
                              ? 'bg-teal-500' 
                              : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            {door.door_availability === 'available' || door.door_status === 'free' 
                              ? 'Free Door' 
                              : 'Occupied'
                            }
                          </span>
                        </div>
                      </div>
                      {door.door_access_code && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Access Code</p>
                          <p className="font-mono text-sm font-semibold">
                            {door.door_access_code}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Generate doors based on total count if API doesn't return doors
                Array.from({ length: podDetails.pod_numtotaldoors || 7 }, (_, index) => (
                  <div
                    key={index + 1}
                    className="bg-white/80 rounded-lg p-4 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          Door -- {index + 1}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                          <span className="text-sm text-gray-600">Free Door</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
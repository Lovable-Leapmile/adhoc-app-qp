import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<any>(null);
  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
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
      const [podData, doorsData] = await Promise.all([apiService.getPodDetails(podId, locationId), apiService.getPodDoors(podId)]);
      setPodDetails(podData);

      // Sort doors by door_number in ascending order
      const sortedDoors = doorsData.sort((a: Door, b: Door) => a.door_number - b.door_number);
      setDoors(sortedDoors);
    } catch (error) {
      console.error("Error loading pod data:", error);
      setError("Failed to load pod information");
      toast.error("Failed to load pod information");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDoorClick = async (door: Door) => {
    try {
      // First fetch the door access code
      const doorData = await apiService.getDoorAccessCode(podId!, door.door_number);
      const doorAccessCode = doorData?.records?.[0]?.door_access_code || 'Not available';
      if (door.door_availability === 'Free' || door.door_availability === 'available') {
        setDialogContent({
          type: 'free',
          message: 'This door is free.',
          doorAccessCode: doorAccessCode
        });
        setDialogOpen(true);
      } else if (door.door_availability === 'Reserved' || door.door_availability === 'occupied') {
        try {
          const reservationData = await apiService.getDoorReservationDetails(door.door_number, podId!);
          if (reservationData) {
            setDialogContent({
              type: 'reserved',
              data: reservationData,
              doorAccessCode: doorAccessCode
            });
            setDialogOpen(true);
          } else {
            toast.error("No reservation details found");
          }
        } catch (error) {
          console.error("Error fetching reservation details:", error);
          toast.error("Failed to fetch reservation details");
        }
      }
    } catch (error) {
      console.error("Error fetching door access code:", error);
      toast.error("Failed to fetch door access code");
    }
  };
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  if (error || !podDetails) {
    return <div className="min-h-screen bg-background my-[16px]">
        <div className="max-w-md mx-auto px-[14px]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin-dashboard')}>
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
            <Button variant="outline" size="sm" className="mt-2" onClick={loadPodData}>
              Retry
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background my-[16px]">
      <div className="max-w-md mx-auto px-[14px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin-dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Pod Doors Overview</h1>
        </div>

        {/* Pod Details Section */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            
            <div className="text-right">
              <span className="font-semibold text-foreground">Pod-Name: {podDetails.pod_name}, Access Code: {podDetails.pod_access_code}</span>
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
              <img src="https://leapmile-website.blr1.cdn.digitaloceanspaces.com/Qikpod/Images/q70.png" alt="QikPod Logo" className="h-8 mx-auto" />
            </div>

            {/* Doors List */}
            <div className="space-y-3">
              {doors.length > 0 ? doors.map(door => <div key={door.door_number} className="bg-white/80 rounded-lg p-4 border border-gray-200 shadow-sm cursor-pointer hover:bg-white/90 transition-colors" onClick={() => handleDoorClick(door)}>
                    <div className="text-center">
                      <h3 className="font-medium text-gray-800">
                        Door: {door.door_number}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${door.door_availability === 'Free' || door.door_availability === 'available' ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {door.door_availability || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>) :
            // Generate doors based on total count if API doesn't return doors
            Array.from({
              length: podDetails.pod_numtotaldoors || 7
            }, (_, index) => <div key={index + 1} className="bg-white/80 rounded-lg p-4 border border-gray-200 shadow-sm cursor-pointer hover:bg-white/90 transition-colors" onClick={() => handleDoorClick({
              door_number: index + 1,
              door_availability: 'Free',
              door_status: 'free',
              door_access_code: ''
            })}>
                    <div className="text-center">
                      <h3 className="font-medium text-gray-800">
                        Door: {index + 1}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                        <span className="text-sm text-gray-600">Free</span>
                      </div>
                    </div>
                  </div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog for door click information */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Door Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {dialogContent?.type === 'free' ? <div className="space-y-3">
                <p className="text-center text-muted-foreground">{dialogContent.message}</p>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Door Access Code</p>
                  <p className="font-mono font-bold text-lg">{dialogContent.doorAccessCode}</p>
                </div>
              </div> : dialogContent?.type === 'reserved' && dialogContent?.data ? <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User Name</p>
                  <p className="font-medium">{dialogContent.data.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{dialogContent.data.user_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flat Number</p>
                  <p className="font-medium">{dialogContent.data.user_flatno}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Door Access Code</p>
                  <p className="font-mono font-bold text-lg">{dialogContent.doorAccessCode}</p>
                </div>
              </div> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}
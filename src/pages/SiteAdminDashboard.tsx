import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Plus, User, Phone, Mail, Home, Trash2, Package, AlertCircle, Zap, Users, History, Clock } from "lucide-react";
import { PaginationFilter } from "@/components/PaginationFilter";
import { getUserData, isLoggedIn } from "@/utils/storage";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { LocationDetectionPopup } from "@/components/LocationDetectionPopup";
import { useLocationDetection } from "@/hooks/useLocationDetection";
interface LocationUser {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_flatno: string;
  user_address: string;
  user_type: string;
}
interface Pod {
  id: string;
  pod_name: string;
  pod_status: string;
  pod_type: string;
  location_id: string;
  created_at: string;
}
interface Reservation {
  id: string;
  user_name: string;
  user_phone: string;
  awb_number: string;
  reservation_status: string;
  created_at: string;
  updated_at: string;
  pod_name?: string;
  location_name?: string;
}
interface NewUserForm {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  user_flatno: string;
}
export default function SiteAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("pods");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showCreateReservationDialog, setShowCreateReservationDialog] = useState(false);
  const [showUserSelectionDialog, setShowUserSelectionDialog] = useState(false);
  const [showConfirmUserDialog, setShowConfirmUserDialog] = useState(false);

  // Data state
  const [locationUsers, setLocationUsers] = useState<LocationUser[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedUser, setSelectedUser] = useState<LocationUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveUserDialog, setShowRemoveUserDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState<LocationUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    user_name: "",
    user_email: "",
    user_phone: "",
    user_address: "",
    user_flatno: ""
  });

  // Location detection
  const currentLocationId = localStorage.getItem('current_location_id');
  const {
    showLocationPopup,
    closeLocationPopup
  } = useLocationDetection(user?.id, currentLocationId);
  useEffect(() => {
    // Check authentication first
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    // Then get user data
    const userData = getUserData();
    setUser(userData);
    if (userData?.user_type !== 'SiteAdmin') {
      navigate('/login');
      return;
    }

    // Reset error state when loading new data
    setError(null);
  }, [navigate]);
  useEffect(() => {
    if (user && currentLocationId) {
      loadData();
    }
  }, [user, currentLocationId, activeTab]);
  const loadData = async () => {
    if (!currentLocationId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "pods") {
        await loadPods();
      } else if (activeTab === "users") {
        await loadLocationUsers();
      } else if (activeTab === "history") {
        await loadHistory();
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  const loadPods = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(`https://stagingv3.leapmile.com/podcore/pods/?location_id=${currentLocationId}&pod_mode=adhoc`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pods');
      }
      const data = await response.json();
      const podsData = data.records || [];
      setPods(podsData);
    } catch (error) {
      console.error("Error loading pods:", error);
      setError("Failed to load pods");
      toast.error("Failed to load pods");
      setPods([]);
    }
  };
  const loadLocationUsers = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(`https://stagingv3.leapmile.com/podcore/users/locations/?location_id=${currentLocationId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      const usersData = data.records || [];
      // Filter to show only customers
      const customers = usersData.filter((user: any) => user.user_type === "User" || user.user_type === "Customer");
      setLocationUsers(customers);
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users");
      toast.error("Failed to load users");
      setLocationUsers([]);
    }
  };
  const loadHistory = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(`https://stagingv3.leapmile.com/podcore/adhoc/reservations/?location_id=${currentLocationId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      const historyData = data.records || [];
      // Sort by created_at desc (newer entries at the top)
      historyData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReservations(historyData);
    } catch (error) {
      console.error("Error loading history:", error);
      setError("Failed to load history");
      toast.error("Failed to load history");
      setReservations([]);
    }
  };
  const handleAddUser = async () => {
    setIsLoading(true);
    try {
      await apiService.registerUser(newUserForm);
      toast.success("User added successfully!");
      setShowAddUserDialog(false);
      setNewUserForm({
        user_name: "",
        user_email: "",
        user_phone: "",
        user_address: "",
        user_flatno: ""
      });
      if (activeTab === "users") {
        await loadLocationUsers();
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error(error?.message || "Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };
  const handleRemoveUser = async () => {
    if (!userToRemove) return;
    setIsLoading(true);
    try {
      await apiService.removeUser(userToRemove.id);
      toast.success("User removed successfully!");
      await loadLocationUsers();
      setShowRemoveUserDialog(false);
      setUserToRemove(null);
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error(error?.message || "Failed to remove user");
    } finally {
      setIsLoading(false);
    }
  };
  const openRemoveUserDialog = (user: LocationUser) => {
    setUserToRemove(user);
    setShowRemoveUserDialog(true);
  };
  const handleSelectUserForReservation = (selectedUser: LocationUser) => {
    setSelectedUser(selectedUser);
    setShowUserSelectionDialog(false);
    setShowConfirmUserDialog(true);
  };
  const handleOpenUserSelectionDialog = async () => {
    setShowUserSelectionDialog(true);
    // Load users when opening the dialog
    if (currentLocationId && locationUsers.length === 0) {
      await loadLocationUsers();
    }
  };
  const handleConfirmUserForReservation = () => {
    if (selectedUser && currentLocationId) {
      navigate(`/reservation?user_id=${selectedUser.user_id}&location_id=${currentLocationId}`);
    }
  };
  const handleUserCardClick = (clickedUser: LocationUser) => {
    navigate(`/profile?user_id=${clickedUser.user_id}&admin_view=true`);
  };
  const handleReservationCardClick = (reservation: Reservation) => {
    navigate(`/reservation-details/${reservation.id}`);
  };
  const filteredPods = Array.isArray(pods) ? pods.filter(pod => pod.pod_name?.toLowerCase().includes(searchQuery.toLowerCase()) || pod.pod_status?.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const filteredUsers = Array.isArray(locationUsers) ? locationUsers.filter(user => user.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || user.user_phone?.includes(searchQuery) || user.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) || user.user_flatno?.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const filteredReservations = Array.isArray(reservations) ? reservations.filter(reservation => reservation.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || reservation.user_phone?.includes(searchQuery) || reservation.awb_number?.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  // Get current items for pagination
  const getCurrentItems = () => {
    let items: any[] = [];
    if (activeTab === "pods") items = filteredPods;else if (activeTab === "users") items = filteredUsers;else if (activeTab === "history") items = filteredReservations;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    return {
      currentItems,
      totalItems,
      totalPages
    };
  };
  const {
    currentItems,
    totalItems,
    totalPages
  } = getCurrentItems();
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Show location popup if needed
  if (showLocationPopup) {
    return <LocationDetectionPopup isOpen={showLocationPopup} onClose={closeLocationPopup} userId={user?.id} locationId={currentLocationId || ''} />;
  }
  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="min-h-screen bg-background my-[16px]">
      {/* User Information Cards */}
      <div className="max-w-md mx-auto px-[14px] mb-6">
        {/* User Name and Phone Number */}
        <Card className="p-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{user?.user_name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user?.user_phone || 'N/A'}</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Drop Code</p>
            <p className="text-lg font-semibold text-foreground">
              {user?.user_dropcode || 'N/A'}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Passcode</p>
            <p className="text-lg font-semibold text-foreground">
              {user?.user_pickupcode || 'N/A'}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
            <p className="text-lg font-semibold text-green-600">
              {user?.user_credit_limit ? Number(user.user_credit_limit) - Number(user.user_credit_used || 0) : 0}
            </p>
          </Card>
          <Card className="p-4 text-center flex items-center justify-center bg-[y#fbe55b] bg-[#fbe55b]">
            <Button onClick={() => setShowAddUserDialog(true)} size="sm" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-[14px]">
        {/* Error Display */}
        {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
              Retry
            </Button>
          </div>}

        {/* Loading State */}
        {isLoading && <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>}

        {!isLoading && <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pods">Pods</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="mt-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>

            <TabsContent value="pods" className="space-y-4 mt-6">
              {currentItems.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                  <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Pods</p>
                  <p className="text-sm">
                    {searchQuery ? "No pods found matching your search." : "No pods found for this location."}
                  </p>
                </div> : <div className="space-y-3">
                  {currentItems.map((pod: Pod) => <Card key={pod.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{pod.pod_name}</h3>
                            <p className="text-sm text-muted-foreground">Type: {pod.pod_type}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`text-xs font-medium ${pod.pod_status === 'available' ? 'text-green-600' : pod.pod_status === 'occupied' ? 'text-orange-600' : 'text-red-600'}`}>
                                {pod.pod_status?.toUpperCase() || 'UNKNOWN'}
                              </span>
                              <span className="text-xs text-muted-foreground">{formatDate(pod.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>)}
                </div>}
            </TabsContent>

            <TabsContent value="users" className="space-y-4 mt-6">
              {currentItems.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Users</p>
                  <p className="text-sm">
                    {searchQuery ? "No users found matching your search." : "No users found for this location."}
                  </p>
                </div> : <div className="space-y-3">
                  {currentItems.map((locationUser: LocationUser) => <Card key={locationUser.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleUserCardClick(locationUser)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground">{locationUser.user_name}</h3>
                            <p className="text-sm text-muted-foreground">{locationUser.user_phone}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-muted-foreground truncate">{locationUser.user_email}</span>
                              <span className="text-xs text-muted-foreground">{locationUser.user_flatno}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={e => {
                  e.stopPropagation();
                  openRemoveUserDialog(locationUser);
                }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>)}
                </div>}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-6">
              {currentItems.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No History</p>
                  <p className="text-sm">
                    {searchQuery ? "No reservations found matching your search." : "Your reservation history will appear here"}
                  </p>
                </div> : <div className="space-y-4">
                  {currentItems.map((reservation: any) => <Card key={reservation.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleReservationCardClick(reservation)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{reservation.created_by_name || reservation.user_name}</h3>
                            <p className="text-sm text-muted-foreground">{reservation.user_phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {reservation.reservation_awbno || reservation.awb_number || 'No AWB'} • {reservation.pod_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(reservation.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${reservation.reservation_status === 'PickupCompleted' ? 'bg-green-100 text-green-800' : reservation.reservation_status === 'DropCompleted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {reservation.reservation_status}
                          </span>
                        </div>
                      </div>
                    </Card>)}
                </div>}
            </TabsContent>
          </Tabs>}
      </div>

      {/* Pagination - only show when we have results */}
      {!isLoading && totalItems > 0 && <div className="max-w-md mx-auto px-[14px] mt-4">
          <PaginationFilter itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} searchQuery="" onSearchChange={() => {}} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} placeholder="" />
        </div>}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new user to this location.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="user_name">Full Name *</Label>
              <Input id="user_name" value={newUserForm.user_name} onChange={e => setNewUserForm(prev => ({
              ...prev,
              user_name: e.target.value
            }))} placeholder="Enter full name" required />
            </div>
            
            <div>
              <Label htmlFor="user_phone">Phone Number *</Label>
              <Input id="user_phone" type="tel" value={newUserForm.user_phone} onChange={e => setNewUserForm(prev => ({
              ...prev,
              user_phone: e.target.value
            }))} placeholder="Enter phone number" required />
            </div>
            
            <div>
              <Label htmlFor="user_email">Email Address</Label>
              <Input id="user_email" type="email" value={newUserForm.user_email} onChange={e => setNewUserForm(prev => ({
              ...prev,
              user_email: e.target.value
            }))} placeholder="Enter email address" />
            </div>
            
            <div>
              <Label htmlFor="user_flatno">Flat/Unit Number</Label>
              <Input id="user_flatno" value={newUserForm.user_flatno} onChange={e => setNewUserForm(prev => ({
              ...prev,
              user_flatno: e.target.value
            }))} placeholder="Enter flat/unit number" />
            </div>
            
            <div>
              <Label htmlFor="user_address">Address</Label>
              <Textarea id="user_address" value={newUserForm.user_address} onChange={e => setNewUserForm(prev => ({
              ...prev,
              user_address: e.target.value
            }))} placeholder="Enter full address" rows={3} />
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isLoading || !newUserForm.user_name || !newUserForm.user_phone}>
              {isLoading ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <Dialog open={showRemoveUserDialog} onOpenChange={setShowRemoveUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userToRemove?.user_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveUserDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveUser} disabled={isLoading}>
              {isLoading ? 'Removing...' : 'Remove User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
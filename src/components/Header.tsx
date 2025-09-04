import { useMemo, useState } from "react";
import { User, MapPin, HelpCircle, LogOut, Menu, Package, CreditCard, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearUserData, clearPodValue } from "@/utils/storage";
import { getUserData } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";
interface HeaderProps {
  title: string; // kept for compatibility; not displayed per new design
  showSettings?: boolean;
}
export function Header({
  title,
  showSettings = true
}: HeaderProps) {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcodeData, setPasscodeData] = useState({ newPasscode: '', confirmPasscode: '' });
  const [showNewPasscode, setShowNewPasscode] = useState(false);
  const [showConfirmPasscode, setShowConfirmPasscode] = useState(false);
  const { toast } = useToast();
  const user = getUserData();
  const roleText = useMemo(() => {
    const userType = user?.user_type;
    if (!userType) return "";
    if (userType === 'Customer') return 'User';
    if (userType === 'SiteSecurity') return 'Site Security';
    if (userType === 'SiteAdmin') return 'Site Admin';
    return userType;
  }, [user]);
  const handleLogout = () => {
    clearUserData();
    clearPodValue();
    navigate('/login');
  };
  return <>
      <header className="bg-gradient-primary sticky top-0 z-50">
        <div className="mobile-container flex items-center justify-between ">
          <div className="flex items-center space-x-3">
            <img src="https://leapmile-website.blr1.cdn.digitaloceanspaces.com/Qikpod/Images/q70.png" alt="Qikpod" className="h-8 w-auto" />
            <span className="text-qikpod-black font-semibold text-xs">{roleText}</span>
          </div>

          {showSettings && <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-qikpod-black hover:bg-black/10 h-8 w-8 p-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <div className="h-full w-full flex flex-col px-0 mx-0">
                  <div className="px-4 py-4 border-b my-[16px]">
                    <div className="flex items-center space-x-3">
                      <img src="https://leapmile-website.blr1.cdn.digitaloceanspaces.com/Qikpod/Images/q70.png" alt="Qikpod" className="w-auto h-8" />
                      <span className="font-semibold text-foreground text-sm">Menu</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="py-2">
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none" onClick={() => navigate('/user-dashboard')}>
                          <User className="mr-3 h-4 w-4" />
                          Home
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none" onClick={() => navigate('/locations')}>
                          <MapPin className="mr-3 h-4 w-4" />
                          Locations
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none" onClick={() => navigate('/profile')}>
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </Button>
                      </SheetClose>
                      {user?.user_type !== 'SiteSecurity' && user?.user_type !== 'Customer' && user?.user_type !== 'User' && (
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none" onClick={() => navigate('/rto')}>
                            <Package className="mr-3 h-4 w-4" />
                            RTO Management
                          </Button>
                        </SheetClose>
                      )}
                      {(user?.user_type === 'Customer' || user?.user_type === 'User') && (
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none" onClick={() => navigate('/credits')}>
                            <CreditCard className="mr-3 h-4 w-4" />
                            Post Pay Credits
                          </Button>
                        </SheetClose>
                      )}
                      {(user?.user_type === 'Customer' || user?.user_type === 'User') && (
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none" onClick={() => setShowPasscodeDialog(true)}>
                            <Lock className="mr-3 h-4 w-4" />
                            Change Passcode
                          </Button>
                        </SheetClose>
                      )}
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none" onClick={() => navigate('/support')}>
                          <HelpCircle className="mr-3 h-4 w-4" />
                          Support
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                  <div className="border-t">
                    <Button variant="ghost" className="w-full justify-start h-12 px-4 rounded-none text-red-600" onClick={() => setShowLogoutDialog(true)}>
                      <LogOut className="mr-3 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>}
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="btn-qikpod">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Passcode Dialog */}
      <Dialog open={showPasscodeDialog} onOpenChange={setShowPasscodeDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Change Passcode</DialogTitle>
            <DialogDescription>
              Enter your new 6-digit passcode and confirm it below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPasscode">Enter New 6-Digit Passcode</Label>
              <div className="relative">
                <Input
                  id="newPasscode"
                  type={showNewPasscode ? "text" : "password"}
                  value={passcodeData.newPasscode}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,6}$/.test(value)) {
                      setPasscodeData(prev => ({ ...prev, newPasscode: value }));
                    }
                  }}
                  maxLength={6}
                  placeholder="------"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPasscode(!showNewPasscode)}
                >
                  {showNewPasscode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPasscode">Re-enter 6-Digit Passcode</Label>
              <div className="relative">
                <Input
                  id="confirmPasscode"
                  type={showConfirmPasscode ? "text" : "password"}
                  value={passcodeData.confirmPasscode}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,6}$/.test(value)) {
                      setPasscodeData(prev => ({ ...prev, confirmPasscode: value }));
                    }
                  }}
                  maxLength={6}
                  placeholder="------"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPasscode(!showConfirmPasscode)}
                >
                  {showConfirmPasscode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowPasscodeDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                // Validation
                if (passcodeData.newPasscode !== passcodeData.confirmPasscode) {
                  toast({
                    title: "Error",
                    description: "Passcodes do not match",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (passcodeData.newPasscode.length !== 6) {
                  toast({
                    title: "Error",
                    description: "Passcode must be exactly 6 digits",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (!/^\d+$/.test(passcodeData.newPasscode)) {
                  toast({
                    title: "Error",
                    description: "Passcode must contain only numbers",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  const authToken = localStorage.getItem('auth_token');
                  const userPhone = user?.user_phone;
                  
                  if (!authToken || !userPhone) {
                    toast({
                      title: "Error",
                      description: "Authentication required",
                      variant: "destructive"
                    });
                    return;
                  }

                  const response = await fetch(`https://stagingv3.leapmile.com/podcore/adhoc/generate_user_code/?user_phone=${userPhone}&change_code=False&new_passcode=${passcodeData.newPasscode}`, {
                    method: 'POST',
                    headers: {
                      'accept': 'application/json',
                      'Authorization': `Bearer ${authToken}`
                    },
                    body: ''
                  });

                  if (!response.ok) {
                    throw new Error('Failed to change passcode');
                  }

                  // Save old passcode to storage
                  localStorage.setItem('user_old_passcode', user?.user_pickupcode || '');
                  
                  toast({
                    title: "Success",
                    description: "Passcode changed successfully",
                  });
                  setShowPasscodeDialog(false);
                  setPasscodeData({ newPasscode: '', confirmPasscode: '' });
                  setShowNewPasscode(false);
                  setShowConfirmPasscode(false);
                } catch (error) {
                  console.error('Error changing passcode:', error);
                  toast({
                    title: "Error",
                    description: "Failed to change passcode. Please try again.",
                    variant: "destructive"
                  });
                }
              }} 
              className="flex-1 btn-primary"
            >
              Change Passcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}
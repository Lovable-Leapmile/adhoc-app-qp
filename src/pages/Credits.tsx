import { getUserData, isLoggedIn } from "@/utils/storage";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, History } from "lucide-react";

export default function Credits() {
  const navigate = useNavigate();
  const user = getUserData();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const availableCredits = user?.user_credit_limit ? Number(user.user_credit_limit) - Number(user.user_credit_used || 0) : 0;
  const totalCredits = user?.user_credit_limit ? Number(user.user_credit_limit) : 0;
  const usedCredits = user?.user_credit_used ? Number(user.user_credit_used) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-[14px] py-6 space-y-6">
        {/* Current Credits Overview */}
        <Card className="p-6 bg-gradient-primary text-qikpod-black">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Credits Overview</h1>
              <p className="text-sm opacity-80">{user?.user_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{availableCredits}</p>
              <p className="text-xs opacity-80">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{usedCredits}</p>
              <p className="text-xs opacity-80">Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalCredits}</p>
              <p className="text-xs opacity-80">Total</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <Button className="w-full h-12 flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Credits</span>
            </Button>
          </Card>
          <Card className="p-4">
            <Button variant="outline" className="w-full h-12 flex items-center justify-center space-x-2">
              <History className="w-4 h-4" />
              <span>Transaction History</span>
            </Button>
          </Card>
        </div>

        {/* Credit Packages */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Credit Packages</h2>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Basic Package</h3>
                <p className="text-sm text-muted-foreground">100 Credits</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₹500</p>
                <Button size="sm" className="mt-1">
                  Purchase
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Standard Package</h3>
                <p className="text-sm text-muted-foreground">250 Credits</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₹1,200</p>
                <Button size="sm" className="mt-1">
                  Purchase
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Premium Package</h3>
                <p className="text-sm text-muted-foreground">500 Credits</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₹2,300</p>
                <Button size="sm" className="mt-1">
                  Purchase
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Terms */}
        <Card className="p-4 bg-muted">
          <h3 className="font-medium mb-2">Terms & Conditions</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Credits are non-refundable</li>
            <li>• Credits expire after 1 year from purchase</li>
            <li>• Credits can be used for locker reservations</li>
            <li>• Contact support for any credit-related issues</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
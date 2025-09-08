import { getUserData, isLoggedIn, refreshUserData } from "@/utils/storage";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: 'razorpay' | 'paytm';
  name: string;
  logo: string;
}

interface PaymentRecord {
  id: string;
  payment_amount: number;
  payment_vendor: string;
  payment_status: string;
  created_at: string;
  payment_url?: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    logo: 'https://app.qikpod.com/assets/assets/images/1545306239_rzp-glyph-positive_1.png'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    logo: 'https://pwebassets.paytm.com/commonwebassets/paytmweb/footer/images/paytmLogo.svg'
  }
];

export default function Credits() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'paytm' | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [pendingPayment, setPendingPayment] = useState<PaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(getUserData());

  // Calculate balance credits and amount payable using live data
  const balanceCredits = userData?.user_credit_limit ? Number(userData.user_credit_limit) - Number(userData.user_credit_used || 0) : 0;
  const amountPayable = balanceCredits < 0 ? Math.abs(balanceCredits) * 1.5 : 0;

  const fetchPaymentHistory = useCallback(async () => {
    if (!userData?.id) return;
    
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(
        `https://stagingv3.leapmile.com/payments/payments/?user_id=${userData.id}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const records = data.records || [];
        setPaymentHistory(records.sort((a: PaymentRecord, b: PaymentRecord) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));

        // Check for latest pending payment
        const latestPayment = records[0];
        if (latestPayment && latestPayment.payment_status === 'pending') {
          setPendingPayment(latestPayment);
          startPaymentStatusCheck(latestPayment.id);
        } else {
          setPendingPayment(null);
        }
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  }, [userData?.id]);

  const refreshAllData = useCallback(async () => {
    try {
      // Refresh user data from API
      const freshUserData = await refreshUserData();
      if (freshUserData) {
        setUserData(freshUserData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // Fallback to cached data if API fails
      const cachedUserData = getUserData();
      setUserData(cachedUserData);
    }
  }, []);

  // Check if we're returning from a payment gateway
  useEffect(() => {
    const checkPaymentReturn = async () => {
      const paymentRedirect = localStorage.getItem('payment_redirect');
      const paymentId = localStorage.getItem('payment_id');

      if (paymentRedirect === 'true' && paymentId) {
        // We returned from a payment gateway, check the status
        localStorage.removeItem('payment_redirect');
        localStorage.removeItem('payment_id');

        // Wait a moment for the backend to process the payment
        setTimeout(async () => {
          await refreshAllData();
          await fetchPaymentHistory();

          // Show success message
          toast({
            title: "Payment Status",
            description: "Your payment is being processed. Status will update shortly.",
          });
        }, 1000);
      } else {
        // Always fetch payment history when component mounts to check for pending payments
        if (userData?.id) {
          fetchPaymentHistory();
        }
      }
    };

    checkPaymentReturn();
  }, [refreshAllData, fetchPaymentHistory, toast, userData?.id]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    // Initial data refresh
    refreshAllData();

    // Set up periodic refresh for live data updates
    const refreshInterval = setInterval(refreshAllData, 10000); // Refresh every 10 seconds

    // Refresh data when user returns to the page (e.g., from payment gateway)
    const handleFocus = () => {
      refreshAllData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate, refreshAllData]);

  // Effect to fetch payment history when userData changes
  useEffect(() => {
    if (userData?.id) {
      fetchPaymentHistory();
    }
  }, [userData?.id, fetchPaymentHistory]);

  const startPaymentStatusCheck = (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 6; // 30 seconds / 5 seconds interval

    const checkStatus = async () => {
      if (attempts >= maxAttempts) return;

      try {
        const authToken = localStorage.getItem('auth_token');
        const response = await fetch(
          `https://stagingv3.leapmile.com/payments/payments/?record_id=${paymentId}`,
          {
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
        if (data.payment_status === 'success') {
          setPendingPayment(null);
          await refreshAllData(); // Refresh user data from API
          fetchPaymentHistory(); // Refresh payment history
          return;
        }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }

      attempts++;
      setTimeout(checkStatus, 5000); // Check again after 5 seconds
    };

    checkStatus();
  };

  const createPayment = async () => {
    // If there's a pending payment, navigate to it instead of creating new one
    if (pendingPayment && pendingPayment.payment_url) {
      localStorage.setItem('payment_redirect', 'true');
      localStorage.setItem('payment_id', pendingPayment.id);
      window.location.href = pendingPayment.payment_url;
      return;
    }

    if (!selectedPaymentMethod || amountPayable <= 0) return;

    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const now = new Date();
      // Format: {userId}-{DDMMYYYYHHMMSS}
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const referenceId = `${userData?.id}-${day}${month}${year}${hours}${minutes}${seconds}`;

      console.log('Creating payment with:', {
        payment_vendor: selectedPaymentMethod,
        amount: amountPayable,
        user_id: userData?.id
      });

      const response = await fetch(
        `https://stagingv3.leapmile.com/payments/payments/create_payment/?payment_client_awbno=${userData?.user_phone}&amount=${amountPayable}&payment_client_reference_id=${referenceId}&user_id=${userData?.id}&user_credits=${Math.abs(balanceCredits)}&payment_vendor=${selectedPaymentMethod}`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      console.log('Payment API response status:', response.status);
      
      const data = await response.json();
      console.log('Payment API response data:', data);

      if (response.ok && data.payment_url) {
        // Set payment redirect flag in localStorage for return detection
        localStorage.setItem('payment_redirect', 'true');
        localStorage.setItem('payment_id', data.id);

        // Use window.location.href for navigation
        window.location.href = data.payment_url;
        return;
      } else {
        throw new Error(data.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-[14px] py-6 space-y-6">
        {/* Credits Display */}
        <Card className="p-6 bg-gradient-primary text-qikpod-black">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Credits</h1>
              <p className="text-sm opacity-80">{userData?.user_name}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Balance Credits:</span>
              <span className="text-xl font-bold">{balanceCredits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Amount Payable:</span>
              <span className="text-xl font-bold">₹{amountPayable.toFixed(1)}</span>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-4">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Select Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <img
                        src={method.logo}
                        alt={method.name}
                        className="h-8 object-contain"
                      />
                      <span className="text-xs font-medium">{method.name}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Pay Button */}
            {amountPayable > 0 ? (
              <Button
                onClick={createPayment}
                disabled={!selectedPaymentMethod || amountPayable <= 0 || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Processing...' : 
                 pendingPayment ? 'Complete Pending Payment' : 
                 `Pay ₹${amountPayable.toFixed(1)}`}
              </Button>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-muted-foreground">No payment required. Your credit balance is positive.</p>
              </Card>
            )}

            {/* Pending Payment Section - Moved below Pay button */}
            {pendingPayment && (
              <Card className="p-4 border-orange-200 bg-orange-50">
                <h3 className="font-medium mb-2 text-orange-800">Pending Payment</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600">
                    ₹{pendingPayment.payment_amount} via {pendingPayment.payment_vendor}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      localStorage.setItem('payment_redirect', 'true');
                      localStorage.setItem('payment_id', pendingPayment.id);
                      window.location.href = pendingPayment.payment_url || '';
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Pay Now
                  </Button>
                </div>
                <p className="text-xs text-orange-500 mt-2">
                  Complete your pending payment before creating a new one.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <Card key={payment.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">₹{payment.payment_amount}</p>
                        <p className="text-sm text-muted-foreground">{payment.payment_vendor}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          payment.payment_status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : payment.payment_status === 'pending'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.payment_status}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-muted-foreground">No payment history found.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
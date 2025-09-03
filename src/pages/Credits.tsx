import { getUserData, isLoggedIn } from "@/utils/storage";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

  const fetchPaymentHistory = async () => {
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
        }
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    
    const refreshData = () => {
      const latestUserData = getUserData();
      setUserData(latestUserData);
    };
    
    // Initial refresh
    refreshData();
    
    // Set up periodic refresh for live data updates
    const refreshInterval = setInterval(refreshData, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, [navigate]);

  // Effect to fetch payment history when userData changes
  useEffect(() => {
    if (userData?.id) {
      fetchPaymentHistory();
    }
  }, [userData?.id]);

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
            fetchPaymentHistory();
            window.location.reload(); // Reload to update credits
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
    if (!selectedPaymentMethod || amountPayable <= 0) return;

    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('auth_token');
      const now = new Date();
      // Format: {userId}-{DDMMYYYYHHMMSS}
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const referenceId = `${userData?.id}-${day}${month}${year}${hours}${minutes}${seconds}`;

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

      if (response.ok) {
        const data = await response.json();
        if (data.payment_url) {
          // Auto-navigate to payment URL
          window.location.href = data.payment_url;
          
          // Set as pending payment and start status checking
          const pendingPaymentData = {
            id: data.id,
            payment_amount: amountPayable,
            payment_vendor: selectedPaymentMethod,
            payment_status: 'pending',
            created_at: new Date().toISOString(),
            payment_url: data.payment_url
          };
          setPendingPayment(pendingPaymentData);
          startPaymentStatusCheck(data.id);
          
          toast({
            title: "Payment initiated",
            description: "Redirecting to payment page..."
          });
        }
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
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
                disabled={!selectedPaymentMethod || amountPayable <= 0 || !!pendingPayment || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Processing...' : `Pay ₹${amountPayable.toFixed(1)}`}
              </Button>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-muted-foreground">No payment required. Your credit balance is positive.</p>
              </Card>
            )}

            {/* Pending Payment Section */}
            {pendingPayment && (
              <Card className="p-4 border-orange-200 bg-orange-50">
                <h3 className="font-medium mb-2 text-orange-800">Pending Payment</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600">
                    ₹{pendingPayment.payment_amount} via {pendingPayment.payment_vendor}
                  </span>
                  <Button 
                    size="sm"
                    onClick={() => window.open(pendingPayment.payment_url, '_blank')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Pay Now
                  </Button>
                </div>
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
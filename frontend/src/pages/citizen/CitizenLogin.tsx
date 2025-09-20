import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, Lock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import janmitraLogo from '@/assets/janmitra-logo-new.png';

export const CitizenLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      toast({
        title: "OTP Sent",
        description: `OTP has been sent to ${formData.phone}`,
      });
    }, 2000);
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp) {
      toast({
        title: "Missing OTP",
        description: "Please enter the OTP.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login Successful",
        description: "Welcome to JANMITRA Citizen Portal",
      });
      navigate('/citizen');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-center mb-4">
            <img src={janmitraLogo} alt="JANMITRA" className="h-12 w-12 mr-3" />
            <h1 className="text-2xl font-bold text-foreground">JANMITRA</h1>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <Users className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-xl font-semibold text-foreground">Citizen Portal</h2>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-civic">
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 ? 'Citizen Login' : 'Verify OTP'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendOTP}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Enter the 6-digit OTP sent to
                  </p>
                  <p className="font-semibold">{formData.phone}</p>
                </div>

                <div>
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleVerifyOTP}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>

                <div className="text-center">
                  <Button variant="ghost" size="sm">
                    Didn't receive OTP? Resend
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>For technical support, contact helpdesk</p>
          <p>or call: 1800-XXX-XXXX</p>
        </div>
      </div>
    </div>
  );
};
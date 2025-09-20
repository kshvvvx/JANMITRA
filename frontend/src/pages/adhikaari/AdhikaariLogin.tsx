import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Phone, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import janmitraLogo from '@/assets/janmitra-logo-new.png';

export const AdhikaariLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    uniqueId: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.uniqueId || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both Unique ID and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login Successful",
        description: "Welcome to JANMITRA Adhikaari Portal",
      });
      navigate('/adhikaari');
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
            <Shield className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-xl font-semibold text-foreground">Adhikaari Portal</h2>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-civic">
          <CardHeader>
            <CardTitle className="text-center">Adhikaari Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="uniqueId" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Unique ID
                </Label>
                <Input
                  id="uniqueId"
                  placeholder="Enter your unique officer ID"
                  value={formData.uniqueId}
                  onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>For technical support, contact IT helpdesk</p>
          <p>or call: 1800-XXX-XXXX</p>
        </div>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, MapPin, Mic, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import janmitraLogo from '@/assets/janmitra-logo-new.png';

export const GuestComplaintFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [complaint, setComplaint] = useState({
    title: '',
    description: '',
    location: '',
    media: null as File | null,
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaCapture = () => {
    // Simulate media capture
    toast({
      title: "Photo Captured",
      description: "Your photo has been added to the complaint",
    });
  };

  const handleLocationDetect = () => {
    // Simulate location detection
    setComplaint(prev => ({ ...prev, location: "Current Location Detected" }));
    toast({
      title: "Location Added",
      description: "Your current location has been added",
    });
  };

  const handleVoiceRecord = () => {
    // Simulate voice recording
    toast({
      title: "Voice Recording",
      description: "Voice recording feature will be available soon",
    });
  };

  const handleSubmit = async () => {
    if (!complaint.title || !complaint.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the title and description",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate complaint submission
    setTimeout(() => {
      setIsSubmitting(false);
      const complaintNumber = `JM${Date.now().toString().slice(-6)}`;
      toast({
        title: "Complaint Submitted",
        description: `Your complaint number is ${complaintNumber}`,
      });
      navigate(`/guest/complaint-success/${complaintNumber}`);
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Capture Evidence</h3>
              <p className="text-muted-foreground mb-6">Take a photo or video of the issue</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleMediaCapture}
                className="w-full h-16 text-lg"
                variant="outline"
              >
                <Camera className="h-6 w-6 mr-2" />
                Take Photo/Video
              </Button>
              
              <Button 
                onClick={() => setStep(2)}
                className="w-full"
              >
                Continue to Location
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Add Location</h3>
              <p className="text-muted-foreground mb-6">Where is this issue located?</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleLocationDetect}
                className="w-full h-16 text-lg"
                variant="outline"
              >
                <MapPin className="h-6 w-6 mr-2" />
                Use Current Location
              </Button>
              
              <div>
                <Label htmlFor="location">Or enter address manually</Label>
                <Input
                  id="location"
                  placeholder="Enter the address"
                  value={complaint.location}
                  onChange={(e) => setComplaint(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={!complaint.location}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Send className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Describe the Issue</h3>
              <p className="text-muted-foreground mb-6">Provide details about the problem</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="Brief title of the issue"
                  value={complaint.title}
                  onChange={(e) => setComplaint(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  value={complaint.description}
                  onChange={(e) => setComplaint(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={handleVoiceRecord}
                className="w-full"
                variant="outline"
              >
                <Mic className="h-4 w-4 mr-2" />
                Record Voice Description
              </Button>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
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
          
          <h2 className="text-xl font-semibold text-foreground mb-2">Guest Reporter</h2>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <Card className="shadow-civic">
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
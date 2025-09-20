import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, MapPin, Mic, MicOff, Upload, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RegisterComplaint = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    location: '',
    coordinates: { lat: 0, lng: 0 },
    description: '',
    media: [] as File[]
  });
  const [complaintNumber, setComplaintNumber] = useState('');

  const categories = [
    'Roads & Infrastructure',
    'Water Supply',
    'Electricity',
    'Sanitation & Waste',
    'Traffic & Transportation',
    'Public Safety',
    'Parks & Recreation',
    'Others'
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Generate mock complaint number
    const number = 'JM' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setComplaintNumber(number);
    setStep(5);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Mock recording functionality
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setFormData({ ...formData, description: 'Voice recorded: Pothole on main road causing vehicle damage' });
      }, 3000);
    }
  };

  if (step === 5) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-civic">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-success" />
            </div>
            <CardTitle className="text-2xl text-success">Complaint Registered!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">Your complaint number is:</p>
              <Badge variant="outline" className="text-lg px-4 py-2 font-mono">
                {complaintNumber}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You will receive updates on the progress of your complaint via notifications.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/citizen')} className="w-full">
                Go to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/citizen/my-complaints')}
                className="w-full"
              >
                View My Complaints
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/citizen')}
            className="text-primary-foreground hover:bg-primary-foreground/20 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Register New Complaint</h1>
            <p className="text-primary-foreground/80">Step {step} of 4</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-muted/50 p-4">
        <div className="container mx-auto">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Upload Media */}
          {step === 1 && (
            <Card className="shadow-civic">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Upload Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Upload Photos or Videos</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Click to upload or drag and drop files here
                  </p>
                  <Button variant="outline">Choose Files</Button>
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <Card className="shadow-civic">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Select Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Map placeholder - Click to select location</p>
                  <Button variant="outline" className="mt-4">
                    Use Current Location
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-delhi">New Delhi</SelectItem>
                        <SelectItem value="south-delhi">South Delhi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="area">Area/Locality</Label>
                    <Input placeholder="Enter specific area or locality" />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Describe Issue */}
          {step === 3 && (
            <Card className="shadow-civic">
              <CardHeader>
                <CardTitle>Describe the Issue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Write Issue Description</Label>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm mb-4">OR</p>
                    <Button
                      variant={isRecording ? "destructive" : "secondary"}
                      onClick={toggleRecording}
                      className="flex items-center"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Record Voice Note
                        </>
                      )}
                    </Button>
                    {isRecording && (
                      <p className="text-destructive text-sm mt-2 animate-pulse">
                        Recording... Speak now
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review and Submit */}
          {step === 4 && (
            <Card className="shadow-civic">
              <CardHeader>
                <CardTitle>Review Your Complaint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="font-medium">{formData.category || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="font-medium">Selected location will appear here</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="font-medium">{formData.description || 'No description provided'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Media</Label>
                    <p className="font-medium">No files uploaded</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleSubmit} className="bg-success hover:bg-success/90">
                    Submit Complaint
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
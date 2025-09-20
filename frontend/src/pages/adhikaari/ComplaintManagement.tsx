import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Upload, CheckCircle, Clock, User, Camera } from 'lucide-react';
import { mockComplaints } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export const ComplaintManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  const complaint = mockComplaints.find(c => c.id === id);

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Not Found</h2>
          <p className="text-muted-foreground mb-4">The complaint you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/adhikaari')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-success text-success-foreground';
      case 'in-progress':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const handleStatusUpdate = () => {
    if (!status) {
      toast({
        title: "Status Required",
        description: "Please select a status before submitting.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Status Updated",
      description: `Complaint ${complaint.complaintNumber} has been updated to ${status}.`,
    });

    // Reset form
    setStatus('');
    setComment('');
    setExpectedDate('');
  };

  const handleResolve = () => {
    toast({
      title: "Complaint Resolved",
      description: `Complaint ${complaint.complaintNumber} has been marked as resolved.`,
    });
    navigate('/adhikaari');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/adhikaari')}
            className="text-primary-foreground hover:bg-primary-foreground/20 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Manage Complaint</h1>
            <p className="text-primary-foreground/80">{complaint.complaintNumber}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Complaint Details */}
          <Card className="shadow-civic">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-mono text-muted-foreground mb-2">
                    {complaint.complaintNumber}
                  </div>
                  <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                </div>
                <Badge className={getStatusColor(complaint.status)}>
                  {getStatusText(complaint.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-foreground leading-relaxed">{complaint.description}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-muted-foreground text-sm">{complaint.location.address}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium">Date Submitted</div>
                      <div className="text-muted-foreground text-sm">
                        {new Date(complaint.dateSubmitted).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium">Citizen ID</div>
                      <div className="text-muted-foreground text-sm">{complaint.citizenId}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-2">Category</div>
                    <Badge variant="outline">{complaint.category}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{complaint.upvotes}</div>
                        <div className="text-sm text-muted-foreground">Upvotes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary">{complaint.refiles}</div>
                        <div className="text-sm text-muted-foreground">Refiles</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="investigating">Under Investigation</SelectItem>
                      <SelectItem value="awaiting-approval">Awaiting Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expectedDate">Expected Resolution Date</Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Update Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Add a comment about the current status or actions taken..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm mb-2">Upload progress photos or documents</p>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleStatusUpdate} className="flex-1">
                  Update Status
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatus('');
                    setComment('');
                    setExpectedDate('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Section */}
          {complaint.status !== 'resolved' && (
            <Card className="shadow-civic border-success/20">
              <CardHeader>
                <CardTitle className="flex items-center text-success">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark as Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Once you have completed all necessary actions and the issue has been resolved, 
                  click the button below to mark this complaint as resolved.
                </p>
                <Button 
                  className="bg-success hover:bg-success/90 w-full"
                  onClick={handleResolve}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Map Placeholder */}
          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Interactive map showing exact complaint location</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Coordinates: {complaint.location.coordinates.lat}, {complaint.location.coordinates.lng}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
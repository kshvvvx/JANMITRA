import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, ThumbsUp, RefreshCw, Clock, User, Send } from 'lucide-react';
import { mockComplaints } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [upvoted, setUpvoted] = useState(false);

  const complaint = mockComplaints.find(c => c.id === id);

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Not Found</h2>
          <p className="text-muted-foreground mb-4">The complaint you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/citizen')}>Go Back Home</Button>
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

  const handleUpvote = () => {
    setUpvoted(!upvoted);
    toast({
      title: upvoted ? "Upvote removed" : "Upvoted!",
      description: upvoted ? "Your upvote has been removed." : "Your upvote has been recorded.",
    });
  };

  const handleRefile = () => {
    toast({
      title: "Refiled!",
      description: "This complaint has been refiled for attention.",
    });
  };

  const handleSendToSupervisor = () => {
    toast({
      title: "Complaint sent to supervisor",
      description: "Complaint sent to supervisor",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/20 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Complaint Details</h1>
            <p className="text-primary-foreground/80">{complaint.complaintNumber}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Complaint Card */}
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

              {/* Details Grid */}
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
                        {new Date(complaint.dateSubmitted).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {complaint.expectedResolution && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <div className="font-medium">Expected Resolution</div>
                        <div className="text-muted-foreground text-sm">
                          {new Date(complaint.expectedResolution).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-2">Category</div>
                    <Badge variant="outline">{complaint.category}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{complaint.upvotes + (upvoted ? 1 : 0)}</div>
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

              {/* Action Buttons */}
              {complaint.status !== 'resolved' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button 
                    variant={upvoted ? "default" : "outline"}
                    onClick={handleUpvote}
                    className="flex items-center"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {upvoted ? 'Upvoted' : 'Upvote'}
                  </Button>
                  <Button variant="outline" onClick={handleRefile}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refile
                  </Button>
                  <Button variant="outline" onClick={handleSendToSupervisor}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Supervisor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Timeline */}
          {complaint.status !== 'pending' && (
            <Card className="shadow-civic">
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-success-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Complaint Submitted</div>
                      <div className="text-muted-foreground text-sm">
                        {new Date(complaint.dateSubmitted).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {complaint.status === 'in-progress' && (
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-warning-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Under Review</div>
                        <div className="text-muted-foreground text-sm">
                          Assigned to department for resolution
                        </div>
                      </div>
                    </div>
                  )}

                  {complaint.status === 'resolved' && (
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 text-success-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Resolved</div>
                        <div className="text-muted-foreground text-sm">
                          Issue has been successfully resolved
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                <p className="text-muted-foreground">Interactive map showing complaint location</p>
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
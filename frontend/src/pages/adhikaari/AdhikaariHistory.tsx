import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, ThumbsUp, CheckCircle } from 'lucide-react';
import { mockComplaints } from '@/data/mockData';

export const AdhikaariHistory = () => {
  const navigate = useNavigate();
  
  // Filter and sort resolved complaints by resolution date
  const resolvedComplaints = mockComplaints
    .filter(complaint => complaint.status === 'resolved')
    .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());

  const handleComplaintClick = (complaintId: string) => {
    navigate(`/complaint/${complaintId}`);
  };

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-xl font-bold">History</h1>
            <p className="text-primary-foreground/80">Resolved Complaints</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-success">{resolvedComplaints.length}</div>
              <div className="text-sm text-muted-foreground">Total Resolved</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">
                {resolvedComplaints.filter(c => new Date(c.dateSubmitted) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-secondary">
                {resolvedComplaints.filter(c => new Date(c.dateSubmitted) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-warning">4.5</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </Card>
          </div>

          {/* Resolved Complaints List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground mb-4">Resolved Complaints</h2>
            
            {resolvedComplaints.length === 0 ? (
              <Card className="text-center p-8">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Resolved Complaints</h3>
                <p className="text-muted-foreground">You haven't resolved any complaints yet.</p>
              </Card>
            ) : (
              resolvedComplaints.map((complaint) => (
                <Card 
                  key={complaint.id}
                  className="cursor-pointer hover:shadow-card transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => handleComplaintClick(complaint.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-mono text-muted-foreground">
                            {complaint.complaintNumber}
                          </div>
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {complaint.title}
                        </h3>
                        
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {complaint.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {complaint.location.address}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(complaint.dateSubmitted).toLocaleDateString('en-IN')}
                          </div>
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {complaint.upvotes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
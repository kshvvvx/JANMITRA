import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ComplaintCard } from '@/components/ui/complaint-card';
import { Shield, Search, MessageCircle, User, History, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockComplaints } from '@/data/mockData';
import janmitraLogo from '@/assets/janmitra-logo-updated.png';

export const AdhikaariHome = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Sort complaints by priority (upvotes) and date
  const sortedComplaints = [...mockComplaints].sort((a, b) => {
    // First priority: urgent complaints (high upvotes)
    if (a.upvotes !== b.upvotes) {
      return b.upvotes - a.upvotes;
    }
    // Second priority: oldest first
    return new Date(a.dateSubmitted).getTime() - new Date(b.dateSubmitted).getTime();
  });

  const filteredComplaints = sortedComplaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const urgentComplaints = filteredComplaints.filter(c => c.upvotes >= 15);
  const pendingCount = mockComplaints.filter(c => c.status === 'pending').length;
  const inProgressCount = mockComplaints.filter(c => c.status === 'in-progress').length;
  const resolvedCount = mockComplaints.filter(c => c.status === 'resolved').length;

  const handleComplaintClick = (complaintId: string) => {
    navigate(`/adhikaari/complaint/${complaintId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={janmitraLogo} alt="JANMITRA" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">JANMITRA</h1>
                <p className="text-primary-foreground/80 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Adhikaari Portal
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => navigate('/adhikaari/profile')}
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => navigate('/')}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome & Stats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Adhikaari Portal
          </h2>
          <p className="text-muted-foreground mb-6">
            Manage and resolve civic complaints efficiently
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
                <div className="text-2xl font-bold text-warning">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{inProgressCount}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-success">{resolvedCount}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
            
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <div className="text-2xl font-bold text-destructive">{urgentComplaints.length}</div>
                <div className="text-sm text-muted-foreground">Urgent</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search complaints by number, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Urgent Complaints Alert */}
        {urgentComplaints.length > 0 && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Urgent Complaints Requiring Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {urgentComplaints.length} complaints have high community engagement and need priority handling.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Complaints List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              All Complaints ({filteredComplaints.length})
            </h3>
            <div className="text-sm text-muted-foreground">
              Sorted by priority and date
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchTerm ? 'No complaints found matching your search.' : 'No complaints available.'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div key={complaint.id} className="relative">
                  {complaint.upvotes >= 15 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 z-10"
                    >
                      URGENT
                    </Badge>
                  )}
                  <ComplaintCard
                    complaint={complaint}
                    onClick={() => handleComplaintClick(complaint.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="container mx-auto flex justify-around">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center space-y-1"
            onClick={() => navigate('/adhikaari/chat')}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">Chat</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center space-y-1"
            onClick={() => navigate('/adhikaari/profile')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center space-y-1"
            onClick={() => navigate('/adhikaari/history')}
          >
            <History className="h-5 w-5" />
            <span className="text-xs">History</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
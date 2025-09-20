import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplaintCard } from '@/components/ui/complaint-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useComplaints } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { Complaint } from '@/lib/api';

export const MyComplaints = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: complaintsData, isLoading, error, refetch } = useComplaints();

  const userComplaints = complaintsData?.complaints || [];

  const resolvedComplaints = userComplaints.filter(
    complaint => complaint.status === 'resolved'
  );

  const unresolvedComplaints = userComplaints.filter(
    complaint => complaint.status !== 'resolved'
  );

  const filteredComplaints = (complaints: Complaint[]) => {
    return complaints.filter(complaint =>
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleComplaintClick = (complaintId: string) => {
    navigate(`/citizen/complaint/${complaintId}`);
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing',
      description: 'Fetching latest complaints...',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load complaints</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/citizen')}
              className="text-primary-foreground hover:bg-primary-foreground/20 mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">My Complaints</h1>
              <p className="text-primary-foreground/80">
                {userComplaints.length} total complaints
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-muted/50 p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({userComplaints.length})
            </TabsTrigger>
            <TabsTrigger value="unresolved">
              Pending ({unresolvedComplaints.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedComplaints.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {filteredComplaints(userComplaints).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No complaints found</p>
                </div>
              ) : (
                filteredComplaints(userComplaints).map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => handleComplaintClick(complaint.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="unresolved" className="mt-6">
            <div className="space-y-4">
              {filteredComplaints(unresolvedComplaints).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No pending complaints</p>
                </div>
              ) : (
                filteredComplaints(unresolvedComplaints).map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => handleComplaintClick(complaint.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            <div className="space-y-4">
              {filteredComplaints(resolvedComplaints).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No resolved complaints</p>
                </div>
              ) : (
                filteredComplaints(resolvedComplaints).map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => handleComplaintClick(complaint.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
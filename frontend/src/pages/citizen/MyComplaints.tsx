import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplaintCard } from '@/components/ui/complaint-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { mockComplaints } from '@/data/mockData';

export const MyComplaints = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter complaints by user (mock data shows user complaints)
  const userComplaints = mockComplaints.filter(complaint => 
    complaint.citizenId === 'citizen1'
  );

  const resolvedComplaints = userComplaints.filter(
    complaint => complaint.status === 'resolved'
  );

  const unresolvedComplaints = userComplaints.filter(
    complaint => complaint.status !== 'resolved'
  );

  const filteredComplaints = (complaints: typeof userComplaints) => {
    return complaints.filter(complaint =>
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleComplaintClick = (complaintId: string) => {
    navigate(`/citizen/complaint/${complaintId}`);
  };

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
            <h1 className="text-xl font-bold">My Complaints</h1>
            <p className="text-primary-foreground/80">Track your submitted issues</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="unresolved" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="unresolved" className="flex items-center space-x-2">
              <span>Unresolved</span>
              <span className="bg-warning/20 text-warning px-2 py-1 rounded-full text-xs">
                {unresolvedComplaints.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center space-x-2">
              <span>Resolved</span>
              <span className="bg-success/20 text-success px-2 py-1 rounded-full text-xs">
                {resolvedComplaints.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unresolved" className="space-y-4">
            {filteredComplaints(unresolvedComplaints).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {searchTerm ? 'No complaints found matching your search.' : 'No unresolved complaints found.'}
                </div>
                <Button onClick={() => navigate('/citizen/register-complaint')}>
                  Register New Complaint
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredComplaints(unresolvedComplaints).map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => handleComplaintClick(complaint.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {filteredComplaints(resolvedComplaints).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {searchTerm ? 'No resolved complaints found matching your search.' : 'No resolved complaints yet.'}
                </div>
                <Button onClick={() => navigate('/citizen/register-complaint')}>
                  Register New Complaint
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredComplaints(resolvedComplaints).map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => handleComplaintClick(complaint.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
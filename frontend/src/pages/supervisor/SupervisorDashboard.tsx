import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageCircle, BarChart3, AlertTriangle, Clock, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockComplaints } from '@/data/mockData';
import janmitraLogo from '@/assets/janmitra-logo-updated.png';

export const SupervisorDashboard = () => {
  const navigate = useNavigate();

  const urgentComplaints = mockComplaints.filter(c => c.upvotes >= 15);
  const pendingCount = mockComplaints.filter(c => c.status === 'pending').length;
  const inProgressCount = mockComplaints.filter(c => c.status === 'in-progress').length;
  const resolvedCount = mockComplaints.filter(c => c.status === 'resolved').length;

  // Mock efficiency data
  const departmentStats = [
    { name: 'Roads & Infrastructure', pending: 5, resolved: 12, efficiency: 85 },
    { name: 'Water Supply', pending: 3, resolved: 8, efficiency: 92 },
    { name: 'Electricity', pending: 2, resolved: 15, efficiency: 88 },
    { name: 'Sanitation', pending: 4, resolved: 10, efficiency: 75 },
  ];

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
                  <Eye className="h-4 w-4 mr-2" />
                  Supervisor Dashboard
                </p>
              </div>
            </div>
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

      <div className="container mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Supervisor Portal
          </h2>
          <p className="text-muted-foreground">
            Monitor departmental efficiency and oversee complaint resolution
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <div className="text-2xl font-bold text-destructive">{urgentComplaints.length}</div>
              <div className="text-sm text-muted-foreground">Escalated</div>
            </CardContent>
          </Card>
          
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold text-warning">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{inProgressCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-success">{resolvedCount}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Escalated Complaints */}
          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Escalated Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentComplaints.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No escalated complaints at the moment
                </p>
              ) : (
                <div className="space-y-3">
                  {urgentComplaints.slice(0, 3).map((complaint) => (
                    <div 
                      key={complaint.id}
                      className="p-3 border border-destructive/20 rounded-lg bg-destructive/5"
                    >
                      <div className="font-medium text-sm">{complaint.complaintNumber}</div>
                      <div className="text-sm text-muted-foreground truncate">{complaint.title}</div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="destructive" className="text-xs">
                          {complaint.upvotes} upvotes
                        </Badge>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {urgentComplaints.length > 3 && (
                    <Button variant="outline" className="w-full">
                      View All ({urgentComplaints.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Efficiency */}
          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Department Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <Badge 
                        variant={dept.efficiency >= 85 ? "default" : dept.efficiency >= 75 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {dept.efficiency}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{dept.pending} pending</span>
                      <span>{dept.resolved} resolved</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          dept.efficiency >= 85 ? 'bg-success' : 
                          dept.efficiency >= 75 ? 'bg-warning' : 'bg-destructive'
                        }`}
                        style={{ width: `${dept.efficiency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-civic cursor-pointer hover:shadow-card transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Department Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Communicate with department heads and coordinators
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/supervisor/chat')}
              >
                Open Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                View detailed performance reports and trends
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Manage officer assignments and workload distribution
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, MapPin, Bell, User, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import janmitraLogo from '@/assets/janmitra-logo-updated.png';

export const CitizenDashboard = () => {
  const navigate = useNavigate();

  const mainActions = [
    {
      title: 'Register New Complaint',
      description: 'Report a new civic issue in your area',
      icon: Plus,
      path: '/citizen/register-complaint',
      bgColor: 'bg-gradient-to-br from-primary to-primary/80',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary'
    },
    {
      title: 'Previous Complaints',
      description: 'View and track your submitted complaints',
      icon: FileText,
      path: '/citizen/my-complaints',
      bgColor: 'bg-gradient-to-br from-secondary to-secondary/80',
      iconBg: 'bg-secondary/20',
      iconColor: 'text-secondary'
    },
    {
      title: 'Complaints Near You',
      description: 'See issues reported in your neighborhood',
      icon: MapPin,
      path: '/citizen/nearby-complaints',
      bgColor: 'bg-gradient-to-br from-success to-success/80',
      iconBg: 'bg-success/20',
      iconColor: 'text-success'
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={janmitraLogo} alt="JANMITRA" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">JANMITRA</h1>
                <p className="text-primary-foreground/80">Citizen Portal</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20 relative"
                onClick={() => navigate('/citizen/notifications')}
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-warning text-warning-foreground text-xs">
                  3
                </Badge>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => navigate('/citizen/profile')}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome to JANMITRA
          </h2>
          <p className="text-muted-foreground">
            How can we help improve your community today?
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {mainActions.map((action, index) => (
            <Card 
              key={index}
              className="group hover:shadow-card transition-all duration-300 cursor-pointer hover:scale-105 border-border/50"
              onClick={() => navigate(action.path)}
            >
              <CardHeader className="pb-4">
                <div className={`w-16 h-16 rounded-xl ${action.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-8 w-8 ${action.iconColor}`} />
                </div>
                <CardTitle className="text-xl">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{action.description}</p>
                <Button 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(action.path);
                  }}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Bottom Navigation for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:hidden">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate('/citizen/notifications')}
            >
              <Bell className="h-5 w-5" />
              <span className="text-xs">Notifications</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate('/citizen/profile')}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate('/citizen/contact')}
            >
              <Send className="h-5 w-5" />
              <span className="text-xs">Contact</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats - Updated to use Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">5</div>
            <div className="text-sm text-muted-foreground">Total Complaints</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-success">2</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-warning">3</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-secondary">45</div>
            <div className="text-sm text-muted-foreground">Community Upvotes</div>
          </Card>
        </div>
      </div>
    </div>
  );
};
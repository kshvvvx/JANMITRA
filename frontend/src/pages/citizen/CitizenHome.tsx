import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, MapPin, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import janmitraLogo from '@/assets/janmitra-logo-new.png';

export const CitizenHome = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Register New Complaint',
      description: 'Report a new civic issue in your area',
      icon: Plus,
      path: '/citizen/register-complaint',
      variant: 'default' as const,
      bgColor: 'bg-gradient-to-br from-primary to-primary/80'
    },
    {
      title: 'Previous Complaints',
      description: 'View and track your submitted complaints',
      icon: FileText,
      path: '/citizen/my-complaints',
      variant: 'secondary' as const,
      bgColor: 'bg-gradient-to-br from-secondary to-secondary/80'
    },
    {
      title: 'Complaints Near You',
      description: 'See issues reported in your neighborhood',
      icon: MapPin,
      path: '/citizen/nearby-complaints',
      variant: 'outline' as const,
      bgColor: 'bg-gradient-to-br from-muted to-muted/80'
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
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => navigate('/citizen/notifications')}
              >
                <Bell className="h-5 w-5" />
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

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {cards.map((card, index) => (
            <Card 
              key={index}
              className="group hover:shadow-card transition-all duration-300 cursor-pointer hover:scale-105 border-border/50"
              onClick={() => navigate(card.path)}
            >
              <CardHeader className="pb-4">
                <div className={`w-16 h-16 rounded-xl ${card.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{card.description}</p>
                <Button 
                  variant={card.variant} 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.path);
                  }}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="bg-gradient-to-r from-muted/50 to-background border-border/50">
          <CardHeader>
            <CardTitle>Your Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Total Complaints</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">2</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">3</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">45</div>
                <div className="text-sm text-muted-foreground">Community Upvotes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
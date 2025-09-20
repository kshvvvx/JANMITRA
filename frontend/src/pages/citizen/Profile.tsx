import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Edit, Save, X, Camera, LogOut, FileText, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockUser } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(mockUser);

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('janmitra-language');
    localStorage.removeItem('janmitra-role');
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

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
            <div className="flex items-center">
              <User className="h-5 w-5 mr-3" />
              <div>
                <h1 className="text-xl font-bold">Profile</h1>
                <p className="text-primary-foreground/80">Manage your account</p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card className="shadow-civic">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  variant={isEditing ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle>Your Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">
                    {userData.stats?.totalComplaints || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Complaints</div>
                </div>

                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {userData.stats?.resolvedComplaints || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>

                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <ThumbsUp className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-secondary">
                    {userData.stats?.totalUpvotes || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Upvotes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-civic">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/citizen/my-complaints')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View My Complaints
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/citizen/register-complaint')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Register New Complaint
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/citizen/notifications')}
              >
                <User className="h-4 w-4 mr-2" />
                Check Notifications
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, FileText, Info, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockNotifications } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const complaintNotifications = notifications.filter(n => n.type === 'complaint');
  const generalNotifications = notifications.filter(n => n.type === 'general');

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-IN');
  };

  const NotificationItem = ({ notification }: { notification: typeof notifications[0] }) => (
    <Card 
      className={`mb-3 cursor-pointer transition-all hover:shadow-card ${
        !notification.read ? 'border-primary/20 bg-primary/5' : ''
      }`}
      onClick={() => {
        markAsRead(notification.id);
        if (notification.complaintId) {
          navigate(`/citizen/complaint/${notification.complaintId}`);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              notification.type === 'complaint' ? 'bg-primary/10' : 'bg-secondary/10'
            }`}>
              {notification.type === 'complaint' ? (
                <FileText className="h-5 w-5 text-primary" />
              ) : (
                <Info className="h-5 w-5 text-secondary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                {!notification.read && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                {notification.message}
              </p>
              <div className="text-xs text-muted-foreground">
                {formatTime(notification.timestamp)}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-3" />
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              <p className="text-primary-foreground/80">Stay updated on your complaints</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Summary */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {notifications.filter(n => !n.read).length}
              </div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {notifications.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="complaints" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="complaints" className="flex items-center space-x-2">
              <span>Complaints</span>
              <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                {complaintNotifications.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <span>General</span>
              <span className="bg-secondary/20 text-secondary px-2 py-1 rounded-full text-xs">
                {generalNotifications.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            {complaintNotifications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground mb-4">No complaint notifications yet.</div>
                <Button onClick={() => navigate('/citizen/register-complaint')}>
                  Register a Complaint
                </Button>
              </div>
            ) : (
              <div>
                {complaintNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="general">
            {generalNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Info className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">No general notifications.</div>
              </div>
            ) : (
              <div>
                {generalNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
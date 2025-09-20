import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MessageCircle, User, Users } from 'lucide-react';

interface Message {
  id: string;
  sender: 'supervisor' | 'adhikaari';
  senderName: string;
  message: string;
  timestamp: Date;
}

export const SupervisorChat = () => {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('Water Department');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'adhikaari',
      senderName: 'Amit Sharma (Water Dept)',
      message: 'Need guidance on prioritizing urgent complaints.',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      sender: 'supervisor',
      senderName: 'You',
      message: 'Focus on complaints with high upvotes and those marked as urgent by citizens first.',
      timestamp: new Date(Date.now() - 3000000)
    },
    {
      id: '3',
      sender: 'adhikaari',
      senderName: 'Priya Verma (Roads Dept)',
      message: 'Multiple road repair complaints in Sector 15. Should I escalate?',
      timestamp: new Date(Date.now() - 2400000)
    }
  ]);

  const departments = [
    'Water Department',
    'Roads Department', 
    'Sanitation Department',
    'Electricity Department',
    'Parks & Recreation'
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'supervisor',
        senderName: 'You',
        message: newMessage.trim(),
        timestamp: new Date()
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/supervisor')}
            className="text-primary-foreground hover:bg-primary-foreground/20 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Users className="h-6 w-6 mr-3" />
            <div>
              <h1 className="text-xl font-bold">Department Chat</h1>
              <p className="text-primary-foreground/80">Communicate with Adhikaaris</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Department List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  Departments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {departments.map((dept) => (
                  <Button
                    key={dept}
                    variant={selectedDepartment === dept ? "default" : "ghost"}
                    className="w-full justify-start text-sm h-auto py-2"
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    {dept}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <div className="md:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {selectedDepartment} Chat
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'supervisor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'supervisor'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border'
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            <User className="h-3 w-3 mr-1" />
                            <span className="text-xs font-medium">
                              {message.senderName}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder={`Message ${selectedDepartment}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setNewMessage("Please prioritize urgent complaints with high danger factor")}
                        className="text-left justify-start h-auto py-3"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Prioritize urgent complaints</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setNewMessage("Update department efficiency metrics")}
                        className="text-left justify-start h-auto py-3"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Update efficiency metrics</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setNewMessage("Need status update on pending complaints")}
                        className="text-left justify-start h-auto py-3"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Status update request</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setNewMessage("Good work on resolving complaints this week")}
                        className="text-left justify-start h-auto py-3"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Appreciation message</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
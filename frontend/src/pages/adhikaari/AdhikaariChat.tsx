import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MessageCircle, User } from 'lucide-react';

interface Message {
  id: string;
  sender: 'adhikaari' | 'supervisor';
  message: string;
  timestamp: Date;
}

export const AdhikaariChat = () => {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'supervisor',
      message: 'Hello! How can I help you today?',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      sender: 'adhikaari',
      message: 'I need guidance on prioritizing urgent complaints.',
      timestamp: new Date(Date.now() - 3000000)
    },
    {
      id: '3',
      sender: 'supervisor',
      message: 'Focus on complaints with high upvotes and those marked as urgent by citizens first.',
      timestamp: new Date(Date.now() - 2400000)
    }
  ]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'adhikaari',
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
            onClick={() => navigate('/adhikaari')}
            className="text-primary-foreground hover:bg-primary-foreground/20 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 mr-3" />
            <div>
              <h1 className="text-xl font-bold">Chat with Supervisor</h1>
              <p className="text-primary-foreground/80">Rajesh Kumar - Ward Supervisor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Supervisor Chat
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'adhikaari' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'adhikaari'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <User className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">
                          {message.sender === 'adhikaari' ? 'You' : 'Supervisor'}
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
                  placeholder="Type your message..."
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
                    onClick={() => setNewMessage("Need urgent assistance with high-priority complaint")}
                    className="text-left justify-start h-auto py-3"
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Need urgent assistance</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNewMessage("Request for complaint priority guidance")}
                    className="text-left justify-start h-auto py-3"
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Request priority guidance</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNewMessage("Department efficiency report update")}
                    className="text-left justify-start h-auto py-3"
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Efficiency report update</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNewMessage("Need resource allocation support")}
                    className="text-left justify-start h-auto py-3"
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Resource allocation support</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, RefreshCw, MapPin, Calendar } from 'lucide-react';
import { Complaint } from '@/types';
import { cn } from '@/lib/utils';

interface ComplaintCardProps {
  complaint: Complaint;
  showActions?: boolean;
  onClick?: () => void;
  onUpvote?: () => void;
  onRefile?: () => void;
}

export const ComplaintCard = ({ 
  complaint, 
  showActions = false,
  onClick,
  onUpvote,
  onRefile
}: ComplaintCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-success text-success-foreground';
      case 'in-progress':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-card transition-shadow cursor-pointer",
        complaint.status === 'resolved' && "border-success/20 bg-success/5"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-mono text-muted-foreground mb-1">
              {complaint.complaintNumber}
            </div>
            <h3 className="font-semibold text-lg leading-tight">
              {complaint.title}
            </h3>
          </div>
          <Badge className={getStatusColor(complaint.status)}>
            {getStatusText(complaint.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {complaint.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{complaint.location.address}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{new Date(complaint.dateSubmitted).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {complaint.upvotes}
            </span>
            <span className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-1" />
              {complaint.refiles}
            </span>
          </div>
          
          {showActions && complaint.status !== 'resolved' && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpvote?.();
                }}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefile?.();
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
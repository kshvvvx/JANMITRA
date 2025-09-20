import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import janmitraLogo from '@/assets/janmitra-logo-new.png';

export const GuestComplaintSuccess = () => {
  const navigate = useNavigate();
  const { complaintNumber } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/5 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={janmitraLogo} alt="JANMITRA" className="h-12 w-12 mr-3" />
            <h1 className="text-2xl font-bold text-foreground">JANMITRA</h1>
          </div>
        </div>

        {/* Success Card */}
        <Card className="shadow-civic border-success/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Submitted!</h2>
              <p className="text-muted-foreground mb-4">
                Your complaint has been successfully registered
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="text-sm text-muted-foreground mb-1">Complaint Number</div>
                <div className="text-2xl font-bold text-primary">{complaintNumber}</div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Your complaint will be reviewed by local authorities. 
                Save this complaint number for future reference.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
              
              <Button 
                onClick={() => navigate('/guest/complaint-flow')}
                variant="outline"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Submit Another Complaint
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>For support, contact: 1800-XXX-XXXX</p>
        </div>
      </div>
    </div>
  );
};
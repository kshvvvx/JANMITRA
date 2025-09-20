import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks';
import { ComplaintService, AIService } from '@/lib/api';

export const TestIntegration = () => {
  const { toast } = useToast();
  const [testText, setTestText] = useState('There is a large pothole on the main road causing traffic issues');
  const [aiResult, setAiResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAIIntegration = async () => {
    setIsLoading(true);
    try {
      const result = await AIService.analyzeText(testText);
      setAiResult(result);
      toast({
        title: 'AI Integration Success!',
        description: 'Successfully connected to AI service',
      });
    } catch (error) {
      toast({
        title: 'AI Integration Failed',
        description: 'Could not connect to AI service. Make sure it\'s running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testComplaintCreation = async () => {
    setIsLoading(true);
    try {
      const complaintData = {
        description: testText,
        category: 'Roads & Infrastructure',
        location: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'Test Location, Bangalore'
        },
        citizen_id: 'test-user'
      };

      const result = await ComplaintService.createComplaint(complaintData);
      toast({
        title: 'Complaint Creation Success!',
        description: `Created complaint: ${result.id}`,
      });
    } catch (error) {
      toast({
        title: 'Complaint Creation Failed',
        description: 'Could not create complaint. Make sure backend is running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testGetComplaints = async () => {
    setIsLoading(true);
    try {
      const result = await ComplaintService.getComplaints();
      toast({
        title: 'Get Complaints Success!',
        description: `Found ${result.complaints?.length || 0} complaints`,
      });
    } catch (error) {
      toast({
        title: 'Get Complaints Failed',
        description: 'Could not fetch complaints. Make sure backend is running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Integration Test Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="test-text">Test Text</Label>
            <Textarea
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={3}
              placeholder="Enter test text for AI analysis..."
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={testAIIntegration} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test AI Service'}
            </Button>
            <Button onClick={testComplaintCreation} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Test Complaint Creation'}
            </Button>
            <Button onClick={testGetComplaints} disabled={isLoading}>
              {isLoading ? 'Fetching...' : 'Test Get Complaints'}
            </Button>
          </div>

          {aiResult && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(aiResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure backend is running on http://localhost:3000</li>
              <li>Make sure AI service is running on http://localhost:8000</li>
              <li>Start the frontend with <code>npm run dev</code></li>
              <li>Test each integration button above</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

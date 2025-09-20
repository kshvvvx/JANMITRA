import { useQuery, useMutation } from '@tanstack/react-query';
import { AIService, ComplaintData } from '../lib/api';

// Analyze text with AI
export function useAIAnalysis() {
  return useMutation({
    mutationFn: (text: string) => AIService.analyzeText(text),
  });
}

// Get danger score
export function useAIDangerScore() {
  return useMutation({
    mutationFn: (complaintData: ComplaintData) => AIService.getDangerScore(complaintData),
  });
}

// Get auto description
export function useAIAutoDescription() {
  return useMutation({
    mutationFn: (complaintData: ComplaintData) => AIService.getAutoDescription(complaintData),
  });
}

// Get similar complaints
export function useAISimilarComplaints() {
  return useMutation({
    mutationFn: ({ complaintData, threshold }: { complaintData: ComplaintData; threshold?: number }) =>
      AIService.getSimilarComplaints(complaintData, threshold),
  });
}

// Submit AI feedback
export function useAISubmitFeedback() {
  return useMutation({
    mutationFn: (feedbackData: {
      complaint_id: string;
      feedback_type: 'positive' | 'negative' | 'correction';
      message?: string;
      corrections?: any;
      user_id?: string;
      session_id?: string;
    }) => AIService.submitFeedback(feedbackData),
  });
}

// Get AI service stats
export function useAIStats(hours = 24) {
  return useQuery({
    queryKey: ['ai-stats', hours],
    queryFn: () => AIService.getStats(hours),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

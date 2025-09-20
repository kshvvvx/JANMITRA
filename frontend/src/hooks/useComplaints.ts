import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComplaintService, CreateComplaintData, UpdateComplaintData } from '../lib/api';

const QUERY_KEYS = {
  complaints: ['complaints'] as const,
  complaint: (id: string) => ['complaints', id] as const,
};

// Get all complaints
export function useComplaints(params?: { page?: number; limit?: number; status?: string; sort?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.complaints, params],
    queryFn: () => ComplaintService.getComplaints(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single complaint
export function useComplaint(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.complaint(id),
    queryFn: () => ComplaintService.getComplaintById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create complaint
export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateComplaintData) => ComplaintService.createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.complaints });
    },
  });
}

// Update complaint status
export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateComplaintData }) =>
      ComplaintService.updateComplaintStatus(id, data),
    onSuccess: (updatedComplaint) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.complaints });
      queryClient.setQueryData(QUERY_KEYS.complaint(updatedComplaint.id), updatedComplaint);
    },
  });
}

// Upvote complaint
export function useUpvoteComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ComplaintService.upvoteComplaint(id),
    onSuccess: (updatedComplaint) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.complaints });
      queryClient.setQueryData(QUERY_KEYS.complaint(updatedComplaint.id), updatedComplaint);
    },
  });
}

// Refile complaint
export function useRefileComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateComplaintData }) =>
      ComplaintService.refileComplaint(id, data),
    onSuccess: (updatedComplaint) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.complaints });
      queryClient.setQueryData(QUERY_KEYS.complaint(updatedComplaint.id), updatedComplaint);
    },
  });
}

// Confirm resolution
export function useConfirmResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ComplaintService.confirmResolution(id),
    onSuccess: (updatedComplaint) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.complaints });
      queryClient.setQueryData(QUERY_KEYS.complaint(updatedComplaint.id), updatedComplaint);
    },
  });
}

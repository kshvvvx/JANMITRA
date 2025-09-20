export type UserRole = 'citizen' | 'guest' | 'adhikaari' | 'supervisor';
export type Language = 'en' | 'hi';

export interface Complaint {
  id: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media: string[];
  status: 'unresolved' | 'in-progress' | 'resolved' | 'awaiting_confirmation';
  upvotes: number;
  created_at: string;
  updated_at: string;
  citizen_id: string;
  actions: Array<{
    type: string;
    timestamp: string;
    user_id: string;
    comment?: string;
  }>;
  title?: string;
  complaintNumber?: string;
  dateSubmitted?: string;
  refiles?: number;
  citizenId?: string;
}

export interface ComplaintComment {
  id: string;
  text: string;
  timestamp: string;
  author: string;
  media?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  photo?: string;
  stats?: {
    totalComplaints: number;
    resolvedComplaints: number;
    totalUpvotes: number;
  };
}

export interface Notification {
  id: string;
  type: 'complaint' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  complaintId?: string;
}
export type UserRole = 'citizen' | 'guest' | 'adhikaari' | 'supervisor';
export type Language = 'en' | 'hi';

export interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status: 'pending' | 'in-progress' | 'resolved';
  category: string;
  dateSubmitted: string;
  expectedResolution?: string;
  upvotes: number;
  refiles: number;
  media?: string[];
  citizenId: string;
  assignedTo?: string;
  comments?: ComplaintComment[];
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
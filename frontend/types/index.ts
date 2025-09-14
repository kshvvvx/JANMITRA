export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Media {
  uri: string;
  type: 'image' | 'video' | 'audio';
  thumbnail?: string;
  duration?: number; // For video/audio
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  location: Location;
  media: Media[];
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  category: string;
  subCategory?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userPhone: string;
  assignedTo?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolutionDetails?: string;
  upvotes: number;
  isAnonymous: boolean;
  department?: string;
  tags?: string[];
  isDraft?: boolean;
}

export interface DraftComplaint extends Omit<Complaint, 'id' | 'createdAt' | 'status'> {
  id?: string;
  isDraft: true;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: 'citizen' | 'staff' | 'supervisor' | 'guest';
  department?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  language: 'en' | 'hi';
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  contactNumber?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userRole: string;
  changes: Record<string, { old: any; new: any }>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Unified complaint types for JANMITRA frontend

export interface Media {
  type: string;
  uri: string;
  thumbnail?: string;
  duration?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface ComplaintBase {
  id: string;
  title?: string;
  description: string;
  category: string;
  location: Location;
  media: Media[];
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userPhone: string;
  isAnonymous: boolean;
  priority: 'low' | 'medium' | 'high';
  upvotes: number;
  confirmations: number;
}

export interface Complaint extends ComplaintBase {
  // Additional fields that might be present in the app but not in the API
  actions?: Array<{
    actorType: string;
    action: string;
    timestamp: string;
    details?: any;
  }>;
  refiles?: Array<{
    userId: string;
    description: string;
    media: Media[];
    createdAt: string;
  }>;
}

// For drafts that haven't been submitted yet
export interface DraftComplaint extends Omit<Complaint, 'id' | 'status' | 'createdAt' | 'updatedAt'> {
  id?: string;
  isDraft: true;
  localId: string;
  lastSaved: string;
}

// For API requests
export interface CreateComplaintRequest {
  citizen_id: string;
  title?: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media: Array<{
    type: string;
    url: string;
    thumbnail?: string;
    duration?: number;
  }>;
  phoneNumber?: string;
}

// For API responses
export interface ApiComplaint {
  id: string;
  citizen_id: string;
  title?: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media: Array<{
    type: string;
    url: string;
    thumbnail?: string;
    duration?: number;
  }>;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_name: string;
  user_phone: string;
  is_anonymous: boolean;
  priority: 'low' | 'medium' | 'high';
  upvotes: string[];
  confirmations: string[];
  actions: Array<{
    actor_type: string;
    action: string;
    timestamp: string;
    details?: any;
  }>;
  refiles: Array<{
    citizen_id: string;
    description: string;
    media: any[];
    created_at: string;
  }>;
}

// Helper functions to convert between API and app types
export const toAppComplaint = (apiComplaint: ApiComplaint): Complaint => ({
  id: apiComplaint.id,
  title: apiComplaint.title,
  description: apiComplaint.description,
  category: apiComplaint.category,
  location: {
    latitude: apiComplaint.location.lat,
    longitude: apiComplaint.location.lng,
    address: apiComplaint.location.address,
  },
  media: apiComplaint.media.map(m => ({
    type: m.type,
    uri: m.url,
    thumbnail: m.thumbnail,
    duration: m.duration,
  })),
  status: apiComplaint.status,
  createdAt: apiComplaint.created_at,
  updatedAt: apiComplaint.updated_at,
  userId: apiComplaint.citizen_id,
  userName: apiComplaint.user_name,
  userPhone: apiComplaint.user_phone,
  isAnonymous: apiComplaint.is_anonymous,
  priority: apiComplaint.priority,
  upvotes: apiComplaint.upvotes.length,
  confirmations: apiComplaint.confirmations.length,
  actions: apiComplaint.actions?.map(a => ({
    actorType: a.actor_type,
    action: a.action,
    timestamp: a.timestamp,
    details: a.details,
  })),
  refiles: apiComplaint.refiles?.map(r => ({
    userId: r.citizen_id,
    description: r.description,
    media: r.media,
    createdAt: r.created_at,
  })),
});

export const toApiComplaint = (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'updatedAt'>): CreateComplaintRequest => ({
  citizen_id: complaint.userId,
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  location: {
    lat: complaint.location.latitude,
    lng: complaint.location.longitude,
    address: complaint.location.address,
  },
  media: complaint.media.map(m => ({
    type: m.type,
    url: m.uri,
    thumbnail: m.thumbnail,
    duration: m.duration,
  })),
  phoneNumber: complaint.userPhone,
});

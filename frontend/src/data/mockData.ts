import { Complaint, User, Notification } from '@/types';

export const mockComplaints: Complaint[] = [
  {
    id: '1',
    complaintNumber: 'JM001234',
    title: 'Pothole on Main Road',
    description: 'Large pothole causing traffic issues and vehicle damage on the main road near the market.',
    location: {
      address: 'Main Road, Near City Market, Sector 15',
      coordinates: { lat: 28.6139, lng: 77.2090 }
    },
    status: 'in-progress',
    category: 'Roads',
    dateSubmitted: '2024-01-15',
    expectedResolution: '2024-01-25',
    upvotes: 23,
    refiles: 5,
    citizenId: 'citizen1',
    assignedTo: 'adhikaari1'
  },
  {
    id: '2',
    complaintNumber: 'JM001235',
    title: 'Street Light Not Working',
    description: 'Street light has been non-functional for 3 weeks, causing safety concerns.',
    location: {
      address: 'Park View Colony, Street 12',
      coordinates: { lat: 28.6129, lng: 77.2080 }
    },
    status: 'pending',
    category: 'Electricity',
    dateSubmitted: '2024-01-10',
    upvotes: 12,
    refiles: 2,
    citizenId: 'citizen1'
  },
  {
    id: '3',
    complaintNumber: 'JM001236',
    title: 'Garbage Collection Issue',
    description: 'Garbage has not been collected for 5 days, causing hygiene problems.',
    location: {
      address: 'Green Park Extension, Block A',
      coordinates: { lat: 28.6149, lng: 77.2100 }
    },
    status: 'resolved',
    category: 'Sanitation',
    dateSubmitted: '2024-01-05',
    upvotes: 18,
    refiles: 1,
    citizenId: 'citizen2'
  }
];

export const mockUser: User = {
  id: 'citizen1',
  name: 'Kush Sharma',
  email: 'kush.sharma@email.com',
  phone: '+91 9876543210',
  role: 'citizen',
  stats: {
    totalComplaints: 5,
    resolvedComplaints: 2,
    totalUpvotes: 45
  }
};

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'complaint',
    title: 'Complaint Status Updated',
    message: 'Your complaint JM001234 status has been updated to "In Progress"',
    timestamp: '2024-01-16T10:30:00Z',
    read: false,
    complaintId: '1'
  },
  {
    id: '2',
    type: 'general',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on January 20th from 2:00 AM to 4:00 AM',
    timestamp: '2024-01-15T09:00:00Z',
    read: true
  }
];
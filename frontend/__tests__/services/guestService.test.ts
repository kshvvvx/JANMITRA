import { GuestService } from '@/services/guestService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage with proper TypeScript types
const mockAsyncStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Type for the mock session
type MockSession = {
  id: string;
  name: string;
  phone: string;
  timestamp: number;
  lastActivity: number;
  complaints: any[];
};

describe('GuestService', () => {
  const mockSession: MockSession = {
    id: 'guest-123',
    name: 'Test User',
    phone: '1234567890',
    timestamp: Date.now(),
    lastActivity: Date.now(),
    complaints: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new guest session', async () => {
      const session = await GuestService.createSession('Test User', '1234567890');
      
      expect(session).toHaveProperty('id');
      expect(session.name).toBe('Test User');
      expect(session.phone).toBe('1234567890');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(session)
      );
    });
  });

  describe('getSession', () => {
    it('should return null if no session exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const session = await GuestService.getSession();
      expect(session).toBeNull();
    });

    it('should return parsed session if exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockSession));
      const session = await GuestService.getSession();
      expect(session).toEqual(mockSession);
    });
  });

  describe('updateLastActivity', () => {
    it('should update lastActivity timestamp', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockSession));
      
      await GuestService.updateLastActivity();
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"lastActivity"')
      );
      const updatedSession = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(updatedSession.lastActivity).toBeGreaterThan(mockSession.lastActivity);
    });
  });

  describe('addComplaint', () => {
    it('should add complaint to session', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockSession));
      
      await GuestService.addComplaint('complaint-123');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"complaint-123"')
      );
    });
  });

  describe('clearSession', () => {
    it('should clear the session', async () => {
      await GuestService.clearSession();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const validSession = { ...mockSession, lastActivity: Date.now() - 1000 * 60 * 60 };
      expect(GuestService.isSessionValid(validSession)).toBe(true);
    });

    it('should return false for expired session', () => {
      const expiredSession = { ...mockSession, lastActivity: Date.now() - 25 * 60 * 60 * 1000 };
      expect(GuestService.isSessionValid(expiredSession)).toBe(false);
    });
  });
});

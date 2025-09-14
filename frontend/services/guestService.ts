import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_SESSION_KEY = '@JANMITRA_GUEST_SESSION';

interface GuestSession {
  id: string;
  name: string;
  phone: string;
  timestamp: number;
  lastActivity: number;
  complaints: string[]; // Array of complaint IDs created by this guest
}

const GuestService = {
  // Create a new guest session
  async createSession(name: string, phone: string): Promise<GuestSession> {
    const session: GuestSession = {
      id: `guest-${Date.now()}`,
      name,
      phone,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      complaints: []
    };
    
    await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  // Get current guest session
  async getSession(): Promise<GuestSession | null> {
    const session = await AsyncStorage.getItem(GUEST_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // Update last activity timestamp
  async updateLastActivity(): Promise<void> {
    const session = await this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    }
  },

  // Add a complaint to guest's session
  async addComplaint(complaintId: string): Promise<void> {
    const session = await this.getSession();
    if (session) {
      session.complaints = [...session.complaints, complaintId];
      session.lastActivity = Date.now();
      await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    }
  },

  // Clear guest session
  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
  },

  // Check if session is valid (not expired)
  isSessionValid(session: GuestSession): boolean {
    // Session expires after 24 hours of inactivity
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    return (Date.now() - session.lastActivity) < TWENTY_FOUR_HOURS;
  }
};

export { GuestService };
export type { GuestSession };

export default GuestService;

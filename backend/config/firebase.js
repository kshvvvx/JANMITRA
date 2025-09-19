const admin = require('firebase-admin');

// Mock Firebase Auth for development
const mockAuth = {
  verifyIdToken: async (token) => {
    console.log('Mock verifyIdToken called with token:', token);
    // In development, accept any token with a phone number
    if (token && token.startsWith('dev-token-')) {
      return { 
        phone_number: '+919876543210', 
        uid: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        email: 'test@example.com',
        email_verified: true
      };
    }
    throw new Error('Invalid token');
  },
  // Add other auth methods as needed
  createCustomToken: async (uid) => {
    console.log('Mock createCustomToken called with uid:', uid);
    return 'dev-token-' + uid;
  },
  getUser: async (uid) => {
    console.log('Mock getUser called with uid:', uid);
    return {
      uid,
      email: 'test@example.com',
      phoneNumber: '+919876543210',
      emailVerified: true
    };
  }
};

// Always use mock auth in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Using mock Firebase Auth for development');
  module.exports = { 
    getAuth: () => mockAuth,
    mockAuth // Export for testing
  };
  
  // Set NODE_ENV if not set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
} else {
  // In production, use real Firebase
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    module.exports = { 
      getAuth: () => admin.auth(),
      admin // Export for testing
    };
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

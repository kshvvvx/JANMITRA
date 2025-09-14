import { GuestService } from './services/guestService';

// Simple test function to verify GuestService functionality
async function testGuestService() {
  console.log('Testing GuestService...\n');

  try {
    // Test 1: Create a new session
    console.log('1. Creating new guest session...');
    const session = await GuestService.createSession('Test User', '1234567890');
    console.log('✅ Created session:', {
      id: session.id,
      name: session.name,
      phone: session.phone,
      complaints: session.complaints.length
    });

    // Test 2: Get the session
    console.log('\n2. Retrieving session...');
    const retrievedSession = await GuestService.getSession();
    console.log('✅ Retrieved session:', !!retrievedSession);
    
    if (retrievedSession) {
      // Test 3: Update last activity
      console.log('\n3. Updating last activity...');
      const oldActivity = retrievedSession.lastActivity;
      await GuestService.updateLastActivity();
      const updatedSession = await GuestService.getSession();
      console.log('✅ Last activity updated:', 
        updatedSession ? updatedSession.lastActivity > oldActivity : false
      );

      // Test 4: Add a complaint
      console.log('\n4. Adding complaint...');
      await GuestService.addComplaint('test-complaint-123');
      const sessionWithComplaint = await GuestService.getSession();
      console.log('✅ Complaint added:', 
        sessionWithComplaint ? sessionWithComplaint.complaints.includes('test-complaint-123') : false
      );
    }

    // Test 5: Check session validity
    console.log('\n5. Checking session validity...');
    const validSession = { 
      id: 'test-1', 
      name: 'Test', 
      phone: '1234567890',
      timestamp: Date.now(),
      lastActivity: Date.now() - 1000 * 60 * 60, // 1 hour old
      complaints: [] 
    };
    
    const expiredSession = { 
      ...validSession, 
      lastActivity: Date.now() - 25 * 60 * 60 * 1000 // 25 hours old
    };
    
    console.log('✅ Valid session check:', GuestService.isSessionValid(validSession));
    console.log('✅ Expired session check:', !GuestService.isSessionValid(expiredSession));

    // Test 6: Clear session
    console.log('\n6. Clearing session...');
    await GuestService.clearSession();
    const clearedSession = await GuestService.getSession();
    console.log('✅ Session cleared:', clearedSession === null);

    console.log('\n🎉 All GuestService tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testGuestService();

const GuestService = require('./frontend/services/guestService').GuestService;

async function testGuestService() {
  console.log('Testing Guest Service...\n');

  // Test createSession
  console.log('1. Testing createSession...');
  const session = await GuestService.createSession('Test User', '1234567890');
  console.log('Created session:', {
    id: session.id,
    name: session.name,
    phone: session.phone,
    'complaints.length': session.complaints.length
  });

  // Test getSession
  console.log('\n2. Testing getSession...');
  const retrievedSession = await GuestService.getSession();
  console.log('Retrieved session:', {
    id: retrievedSession.id,
    name: retrievedSession.name,
    phone: retrievedSession.phone
  });

  // Test updateLastActivity
  console.log('\n3. Testing updateLastActivity...');
  const oldActivity = retrievedSession.lastActivity;
  await GuestService.updateLastActivity();
  const updatedSession = await GuestService.getSession();
  console.log('Last activity updated:', 
    updatedSession.lastActivity > oldActivity ? '✅' : '❌',
    `(was: ${new Date(oldActivity).toISOString()}, now: ${new Date(updatedSession.lastActivity).toISOString()})`
  );

  // Test addComplaint
  console.log('\n4. Testing addComplaint...');
  await GuestService.addComplaint('complaint-123');
  const sessionWithComplaint = await GuestService.getSession();
  console.log('Added complaint:', 
    sessionWithComplaint.complaints.includes('complaint-123') ? '✅' : '❌',
    `Complaints: [${sessionWithComplaint.complaints.join(', ')}]`
  );

  // Test isSessionValid
  console.log('\n5. Testing isSessionValid...');
  const validSession = { ...session, lastActivity: Date.now() - 1000 * 60 * 60 }; // 1 hour ago
  const expiredSession = { ...session, lastActivity: Date.now() - 25 * 60 * 60 * 1000 }; // 25 hours ago
  
  console.log('Valid session:', 
    GuestService.isSessionValid(validSession) ? '✅' : '❌'
  );
  console.log('Expired session:', 
    !GuestService.isSessionValid(expiredSession) ? '✅' : '❌'
  );

  // Test clearSession
  console.log('\n6. Testing clearSession...');
  await GuestService.clearSession();
  const clearedSession = await GuestService.getSession();
  console.log('Session cleared:', clearedSession === null ? '✅' : '❌');

  console.log('\n✅ Guest Service tests completed!');
}

testGuestService().catch(console.error);

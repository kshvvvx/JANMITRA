// Test script for GuestService in Node.js environment
const { GuestService } = require('./frontend/services/guestService');

async function runTests() {
  console.log('Starting GuestService tests...\n');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${name}`, error.message);
      failed++;
    }
  };

  // Test 1: Create session
  await test('Create guest session', async () => {
    const session = await GuestService.createSession('Test User', '1234567890');
    if (!session || !session.id || session.name !== 'Test User') {
      throw new Error('Session creation failed');
    }
  });

  // Test 2: Get session
  await test('Get guest session', async () => {
    const session = await GuestService.getSession();
    if (!session) throw new Error('Failed to retrieve session');
  });

  // Test 3: Update last activity
  await test('Update last activity', async () => {
    const oldSession = await GuestService.getSession();
    await GuestService.updateLastActivity();
    const newSession = await GuestService.getSession();
    if (newSession.lastActivity <= oldSession.lastActivity) {
      throw new Error('Last activity not updated');
    }
  });

  // Test 4: Add complaint
  await test('Add complaint to session', async () => {
    await GuestService.addComplaint('test-complaint-123');
    const session = await GuestService.getSession();
    if (!session.complaints.includes('test-complaint-123')) {
      throw new Error('Complaint not added to session');
    }
  });

  // Test 5: Session validity
  await test('Check session validity', () => {
    const validSession = { 
      id: 'test', 
      name: 'Test', 
      phone: '123',
      timestamp: Date.now(),
      lastActivity: Date.now() - 1000 * 60 * 60, // 1 hour old
      complaints: []
    };
    if (!GuestService.isSessionValid(validSession)) {
      throw new Error('Valid session marked as invalid');
    }

    const expiredSession = { 
      ...validSession, 
      lastActivity: Date.now() - 25 * 60 * 60 * 1000 // 25 hours old
    };
    if (GuestService.isSessionValid(expiredSession)) {
      throw new Error('Expired session marked as valid');
    }
  });

  // Test 6: Clear session
  await test('Clear guest session', async () => {
    await GuestService.clearSession();
    const session = await GuestService.getSession();
    if (session !== null) {
      throw new Error('Session not cleared');
    }
  });

  console.log('\nTest Summary:');
  console.log(`✅ ${passed} tests passed`);
  console.log(`❌ ${failed} tests failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// Make sure we clean up on exit
process.on('exit', async () => {
  await GuestService.clearSession();
});

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});

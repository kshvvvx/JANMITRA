const fetch = require('node-fetch');

async function testDangerScore() {
  const testData = {
    description: 'Broken water pipe flooding the street near the park',
    category: 'water',
    location: {
      latitude: 12.9716,
      longitude: 77.5946
    },
    media_count: 1,
    upvotes: 0
  };

  console.log('Testing /api/ai/danger-score endpoint...');
  console.log('Sending data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:8000/api/ai/danger-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response from AI service:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error testing AI service:', error);
    throw error;
  }
}

testDangerScore()
  .then(() => console.log('Test completed successfully'))
  .catch(err => console.error('Test failed:', err));

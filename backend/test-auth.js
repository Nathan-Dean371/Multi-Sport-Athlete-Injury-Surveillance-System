// Test authentication endpoint
const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'liam.murphy@email.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  }
};

testLogin();

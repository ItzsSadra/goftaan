// Test POST request with detailed logging
async function testPost() {
    console.log('Testing POST request...');
    
    const testData = {
        user_id: "test_user",
        title: "Test Meeting",
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 3600000).toISOString()
    };
    
    console.log('Request URL:', 'http://goftaanmeetings.chbk.dev/api/meetings');
    console.log('Request Data:', testData);
    
    try {
        const response = await fetch('http://goftaanmeetings.chbk.dev/api/meetings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(testData),
            mode: 'cors',
            credentials: 'omit'
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Run the test
testPost();
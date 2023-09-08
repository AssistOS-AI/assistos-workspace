const fetch = require('node-fetch');

// Your OpenAI API key
const apiKey = "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";

async function apiFetch() {
    const url = 'https://api.openai.com/v1/chat/completions';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}` // Remove trailing spaces if any
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: 'What is 1*10+50+40+20-4' }
            ],
            temperature: 0.7
        })
    };

    try {
        const response = await fetch(url, options);

        if (response.status !== 200) {
            console.log(`Response Status: ${response.status}`);
            console.log(`Response Text: ${await response.text()}`);
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result.choices[0].message.content);

    } catch (error) {
        console.log('API call failed:', error);
    }
}

// Execute the test
apiFetch();

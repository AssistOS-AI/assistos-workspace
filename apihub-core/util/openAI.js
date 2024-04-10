function maskKey(str) {
    if (str.length <= 10) {
        return str;
    }
    const start = str.slice(0, 6);
    const end = str.slice(-4);
    const maskedLength = str.length - 10;
    const masked = '*'.repeat(maskedLength);
    return start + masked + end;
}

async function validateOpenAiKey(apiKey) {
    const endpoint = 'https://api.openai.com/v1/models';
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            let errorMessage = `Error: ${response.status} - ${errorData.error}`;
            switch (response.status) {
                case 401:
                case 403:
                    errorMessage = 'Unauthorized: Invalid API Key';
                    break;
                case 404:
                    errorMessage = 'Invalid Endpoint';
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    errorMessage = 'Server Error: OpenAI may be experiencing issues. Please try again later.';
                    break;
                default:
                    break;
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        throw error;
    }
}

module.exports = {
    validateOpenAiKey,
    maskKey
}

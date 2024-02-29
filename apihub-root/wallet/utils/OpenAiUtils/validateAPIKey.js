export async function validateOpenAiKey(apiKey) {
    const endpoint = 'https://api.openai.com/v1/models';
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (response.ok) {
            return {
                success: true
            };
        } else {
            const errorData = await response.json();
            let errorMessage = `Error: ${response.status} - ${errorData.error}`;
            switch (response.status) {
                case 401:
                case 403:
                    errorMessage = 'Invalid API Key';
                    break;
                case 404:
                    errorMessage = 'Invalid Endpoint';
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    /* TODO Allow creating the space when OpenAi is down? */
                    errorMessage = 'Server Error: OpenAI may be experiencing issues. Please try again later.';
                    break;
                default:
                    break;
            }
            return {
                success: false,
                error: errorMessage
            }
        }
    } catch (error) {
        return {
            success: false,
            error: error
        }
    }
}
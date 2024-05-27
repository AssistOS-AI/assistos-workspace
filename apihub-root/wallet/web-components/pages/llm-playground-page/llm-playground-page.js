export class LLMPlaygroundPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
    }

    afterRender() {
    }

    async generateResponse(_target) {
        this.clearResult();
        const prompt = this.element.querySelector('#prompt').value;
        const modelName = "GPT-4o";

        if (!prompt.trim()) {
            alert('Please enter a prompt.');
            return;
        }

        if (this.eventSource) {
            this.eventSource.close();
        }

        const requestData = {
            modelName: modelName,
            prompt: prompt,
        };

        try {
            const response = await fetch(`/apis/v1/spaces/${assistOS.space.id}/llms/text/streaming/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Error: ${error.message}`);
                return;
            }

            const data = await response.json();
            this.sessionId = data.sessionId;

            this.eventSource = new EventSource(`/apis/v1/spaces/${assistOS.space.id}/llms/text/streaming/generate?sessionId=${this.sessionId}`, {
                withCredentials: true
            });

            this.eventSource.onmessage = (event) => {
                const resultContainer = this.element.querySelector('#result');
                try {
                    const dataStr = event.data.replace(/^data:\s*/, '');
                    const json = JSON.parse(dataStr);
                    if (json.sessionId) {
                        this.sessionId = json.sessionId;
                    }
                    if (json.message) {
                        resultContainer.innerHTML += `<p>${json.message}</p>`;
                    }
                } catch (e) {
                    console.error('Failed to parse event data:', e);
                }
            };

            this.eventSource.addEventListener('end', (event) => {
                const resultContainer = this.element.querySelector('#result');
                try {
                    const dataStr = event.data.replace(/^data:\s*/, '');
                    const json = JSON.parse(dataStr);
                    resultContainer.innerHTML += `<p>Complete: ${json.message}</p>`;
                } catch (e) {
                    console.error('Failed to parse complete event data:', e);
                }
                this.eventSource.close();
            });

            this.eventSource.onerror = (error) => {
                this.eventSource.close();
                console.error('EventSource error:', error);
                alert('Error occurred. Check the console for more details.');
            };
        } catch (error) {
            console.error('Failed to fetch:', error);
            alert('Error occurred. Check the console for more details.');
        }
    }

    clearPrompt() {
        this.element.querySelector('#prompt').value = '';
    }

    clearResult() {
        this.element.querySelector('#result').innerHTML = '';
    }
}
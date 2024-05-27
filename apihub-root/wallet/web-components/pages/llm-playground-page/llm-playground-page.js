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
        debugger
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
        let data
        try {
            data = await response.json();
        } catch (e) {
            data = await response.text();
        }
        this.sessionId = data.sessionId;

        this.eventSource = new EventSource(`/apis/v1/spaces/${assistOS.space.id}/llms/text/streaming/generate?sessionId=${this.sessionId}`, {
            withCredentials: true
        });

        this.eventSource.onmessage = (event) => {
            const resultContainer = this.element.querySelector('#result');
            resultContainer.innerHTML += event.data;
        };

        this.eventSource.addEventListener('complete', (event) => {
            const resultContainer = this.element.querySelector('#result');
            const message = JSON.parse(event.data).message;
            resultContainer.innerHTML += `<p>Complete: ${message}</p>`;
            this.eventSource.close();
        });

        this.eventSource.onerror = (error) => {
            this.eventSource.close();
            console.error(error);
            alert('Error occurred. Check the console for more details.');
        };
    }

    clearPrompt() {
        this.element.querySelector('#prompt').value = '';
    }

    clearResult() {
        this.element.querySelector('#result').innerHTML = '';
    }
}

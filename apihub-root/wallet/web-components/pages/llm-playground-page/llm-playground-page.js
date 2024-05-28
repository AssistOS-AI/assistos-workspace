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

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split("\n");

                buffer = lines.pop();

                for (let line of lines) {
                    if (line.startsWith("event:")) {
                        const eventName = line.replace("event:", "").trim();
                        lines.shift();
                        const eventData = lines.shift().replace("data:", "").trim();
                        this.handleEvent({ type: eventName, data: eventData });
                    } else if (line.startsWith("data:")) {
                        const eventData = line.replace("data:", "").trim();
                        this.handleEvent({ type: "message", data: eventData });
                    }
                }
            }

            if (buffer.trim()) {
                this.handleEvent({ type: "message", data: buffer.trim() });
            }

        } catch (error) {
            console.error('Failed to fetch:', error);
            alert('Error occurred. Check the console for more details.');
        }
    }

    handleEvent(event) {
        const resultContainer = this.element.querySelector('#result');
        try {
            const json = JSON.parse(event.data);
            if (json.sessionId) {
                this.sessionId = json.sessionId;
            }
            if (json.message) {
                resultContainer.innerHTML += `${json.message}`;
            }
       /*     if (event.type === 'end') {
                resultContainer.innerHTML += `<p>Complete: ${json.fullResponse || 'No final message'}</p>`;
            }*/
        } catch (e) {
            console.error('Failed to parse event data:', e);
        }
    }

    clearPrompt() {
        this.element.querySelector('#prompt').value = '';
    }

    clearResult() {
        this.element.querySelector('#result').innerHTML = '';
    }
}

export class FbMmsTtsBhtModelPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.isGenerating = false;
        this.STORAGE_KEY = 'tts_api_key';

        this.invalidate(() => {});
    }

    beforeRender() {
        return {};
    }

    afterRender() {
        const globalSpinner = document.querySelector('.global-spinner');
        if (globalSpinner) {
            globalSpinner.style.display = 'none';
        }

        this.apiKeyInput = this.element.querySelector('#api-key');
        this.promptInput = this.element.querySelector('#prompt');
        this.submitButton = this.element.querySelector('.submit-btn');
        this.loadingIndicator = this.element.querySelector('.loading-indicator');
        this.audioContainer = this.element.querySelector('#audioContainer');
        this.generatedAudio = this.element.querySelector('#generatedAudio');
        this.initialPlaceholder = this.element.querySelector('#initialPlaceholder');

        this.loadCachedApiKey();
        this.apiKeyInput.addEventListener('change', () => this.cacheApiKey());

        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }

        const inputSection = this.element.querySelector('.input-section');
        if (inputSection) {
            inputSection.style.display = 'block';
            inputSection.style.opacity = '1';
        }
    }

    loadCachedApiKey() {
        try {
            const cachedApiKey = localStorage.getItem(this.STORAGE_KEY);
            if (cachedApiKey) {
                this.apiKeyInput.value = cachedApiKey;
            }
        } catch (error) {
            console.warn('Failed to load cached API key:', error);
        }
    }

    cacheApiKey() {
        try {
            const currentApiKey = this.apiKeyInput.value.trim();
            if (currentApiKey) {
                localStorage.setItem(this.STORAGE_KEY, currentApiKey);
            } else {
                localStorage.removeItem(this.STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Failed to cache API key:', error);
        }
    }

    async generateSpeech(_target) {
        if (this.isGenerating) return;

        const apiKey = this.apiKeyInput.value.trim();
        const prompt = this.promptInput.value.trim();

        if (!apiKey || !prompt) {
            assistOS.UI.showNotification('Please provide both API key and text', 'error');
            return;
        }

        this.isGenerating = true;
        this.submitButton.disabled = true;
        this.loadingIndicator.classList.remove('hidden');
        this.audioContainer.classList.add('hidden');
        this.initialPlaceholder.classList.add('hidden');

        try {
            const audioBlob = await this.queryTTSAPI(apiKey, prompt);

            // Convert blob to URL
            const audioUrl = URL.createObjectURL(audioBlob);

            // Update audio player
            this.generatedAudio.src = audioUrl;
            this.audioContainer.classList.remove('hidden');

            // Clean up the old URL if it exists
            if (this.currentAudioUrl) {
                URL.revokeObjectURL(this.currentAudioUrl);
            }
            this.currentAudioUrl = audioUrl;

        } catch (error) {
            console.error('Speech generation failed:', error);
            assistOS.UI.showNotification('Failed to generate speech. Please check your API key and try again.', 'error');
            this.initialPlaceholder.classList.remove('hidden');
        } finally {
            this.isGenerating = false;
            this.submitButton.disabled = false;
            this.loadingIndicator.classList.add('hidden');
        }
    }

    async queryTTSAPI(apiKey, text) {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/facebook/mms-tts-bht",
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ "inputs": text })
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return response.blob();
    }
}
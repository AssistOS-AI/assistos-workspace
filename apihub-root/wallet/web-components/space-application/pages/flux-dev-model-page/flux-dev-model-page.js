export class FluxDevModelPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.isGenerating = false;
        this.STORAGE_KEY = 'flux_api_key';  // Key for localStorage

        // Force an initial render
        this.invalidate(() => {
            // Any initialization that needs to happen immediately
        });
    }

    beforeRender() {
        // Set any initial state or data needed for rendering
        return {
            // If you need to return any data for the template
        };
    }

    afterRender() {
        // Remove any global loading indicators
        const globalSpinner = document.querySelector('.global-spinner'); // Adjust selector based on your app
        if (globalSpinner) {
            globalSpinner.style.display = 'none';
        }

        // Initialize your page elements
        this.apiKeyInput = this.element.querySelector('#api-key');
        this.promptInput = this.element.querySelector('#prompt');
        this.submitButton = this.element.querySelector('.submit-btn');
        this.loadingIndicator = this.element.querySelector('.loading-indicator');
        this.imageContainer = this.element.querySelector('#imageContainer');
        this.generatedImage = this.element.querySelector('#generatedImage');
        this.initialPlaceholder = this.element.querySelector('#initialPlaceholder');

        // Load cached API key if it exists
        this.loadCachedApiKey();

        // Add event listener for API key changes
        this.apiKeyInput.addEventListener('change', () => this.cacheApiKey());

        // Make sure your loading indicator is hidden initially
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }

        // Make sure the form is visible and interactive
        const inputSection = this.element.querySelector('.input-section');
        if (inputSection) {
            inputSection.style.display = 'block';
            inputSection.style.opacity = '1';
        }
    }

    // Load the cached API key from localStorage
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

    // Cache the current API key in localStorage
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

    async generateImage(_target) {
        if (this.isGenerating) return;

        const apiKey = this.apiKeyInput.value.trim();
        const prompt = this.promptInput.value.trim();

        if (!apiKey || !prompt) {
            assistOS.UI.showNotification('Please provide both API key and prompt', 'error');
            return;
        }

        this.isGenerating = true;
        this.submitButton.disabled = true;
        this.loadingIndicator.classList.remove('hidden');
        this.imageContainer.classList.add('hidden');
        this.initialPlaceholder.classList.add('hidden');

        try {
            const result = await this.queryFluxAPI(apiKey, prompt);

            // Convert blob to URL
            const imageUrl = URL.createObjectURL(result);

            // Display the image
            this.generatedImage.src = imageUrl;
            this.imageContainer.classList.remove('hidden');

            // Clean up the old URL if it exists
            if (this.currentImageUrl) {
                URL.revokeObjectURL(this.currentImageUrl);
            }
            this.currentImageUrl = imageUrl;

        } catch (error) {
            console.error('Image generation failed:', error);
            assistOS.UI.showNotification('Failed to generate image. Please check your API key and try again.', 'error');
            this.initialPlaceholder.classList.remove('hidden');
        } finally {
            this.isGenerating = false;
            this.submitButton.disabled = false;
            this.loadingIndicator.classList.add('hidden');
        }
    }

    async queryFluxAPI(apiKey, prompt) {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ "inputs": prompt })
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return response.blob();
    }
}
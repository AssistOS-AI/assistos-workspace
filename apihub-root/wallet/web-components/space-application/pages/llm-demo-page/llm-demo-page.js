export class LlmDemoPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;

        // Initialize state
        this.models = {
            claude: {
                name: 'Claude',
                type: 'text',
                description: 'Anthropic\'s AI model focused on helpful and honest interactions',
            },
            'flux-schnell': {
                name: 'Flux.1 Schnell',
                type: 'image',
                description: 'Image generation from text descriptions based on Flux.1 schnell',
            },
            'flux-dev': {
                name: 'Flux.1 Dev',
                type: 'image',
                description: 'Image generation from text descriptions based on Flux.1 dev',
            },
            coqui: {
                name: 'Coqui.XTTS',
                type: 'audio',
                description: 'Text-to-speech model based on Coqui.XTTS',
            }
        };

        this.invalidate();
    }

    async navigateToModel(_target, modelId) {
        if (!this.models[modelId]) {
            console.error(`Model ${modelId} not found`);
            return;
        }

        try {
            await assistOS.UI.changeToDynamicPage(
                "space-application-page",
                `${assistOS.space.id}/Space/${modelId}-model-page`
            );
        } catch (error) {
            console.error('Navigation failed:', error);
            assistOS.UI.showNotification('Error loading demo', 'error');
        }
    }

    beforeRender() {
        // Any pre-rendering logic can go here
        // For example, fetching model status or availability
    }

    afterRender() {
        // Add any post-rendering event listeners or initialization here
        this.addCardHoverEffects();
    }

    addCardHoverEffects() {
        const cards = this.element.querySelectorAll('.model-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
}
const personalityModule = assistOS.loadModule("agent", {});
const applicationModule = assistOS.loadModule("application", {});
const WebAssistant = assistOS.loadModule("webassistant", {});

export class ApplicationCreatorSettings {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Settings"
        this.spaceId = assistOS.space.id
        this.webAssistantId = assistOS.space.webAssistant;
        this.invalidate();
    }

    async beforeRender() {
        const settings = await WebAssistant.getSettings(this.spaceId, this.webAssistantId);
        this.initialPrompt = settings.initialPrompt;
        this.chatIndications = settings.chatIndications;
        this.themeId = settings.themeId;
        this.agent = settings.agentId;
        this.knowledge = settings.knowledge;
        this.publicChecked = settings.isPublic ? "checked" : "";
        const agents = await personalityModule.getAgents(this.spaceId)
        this.personalitiesOptions = (agents || []).map(personality => `<option value="${personality.id}" ${this.agent === personality.id ? "selected" : ""}>${personality.name}</option>`).join('');

        const themes = await WebAssistant.getThemes(this.spaceId,this.webAssistantId);
        this.themes = (themes || []).map(theme => `<option value="${theme.id}" ${this.theme === theme.id ? "selected" : ""}>${theme.name}</option>`).join('');
    }

    async afterRender() {

    }

    async saveSettings(eventTarget) {
        const form = this.element.querySelector('.application-form');
        let formData = await assistOS.UI.extractFormInformation(form);

        const initialPrompt = this.element.querySelector('#initial-prompt').value;
        const chatIndications = this.element.querySelector('#chat-indications').value;
        const knowledge = this.element.querySelector('#knowledge').value;
        const isPublic = this.element.querySelector('#public').checked;
        if (formData.isValid) {
            const settingsData = {
                knowledge: knowledge,
                themeId: formData.data.selectedTheme,
                agentId: formData.data.selectedPersonality,
                chatIndications: chatIndications,
                initialPrompt: initialPrompt,
                isPublic
            }
            await WebAssistant.updateSettings(this.spaceId,this.webAssistantId, settingsData);
            this.invalidate();
        }
    }

}
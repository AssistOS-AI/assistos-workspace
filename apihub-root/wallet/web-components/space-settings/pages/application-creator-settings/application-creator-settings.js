const personalityModule = assistOS.loadModule("agent", {});
const applicationModule = assistOS.loadModule("application", {});
const WebAssistant = assistOS.loadModule("webassistant", {});

export class ApplicationCreatorSettings {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Settings"
        this.spaceId = assistOS.space.id
        this.invalidate();
    }

    async beforeRender() {
        const settings = await WebAssistant.getSettings(this.spaceId);
        this.initialPrompt = settings.initialPrompt;
        this.chatIndications = settings.chatIndications;
        this.themeId = settings.themeId;
        this.agent = settings.agentId;
        this.knowledge = settings.knowledge;
        this.header = settings.header;
        this.footer = settings.footer;

        const widgets = await applicationModule.getWidgets(this.spaceId);

        this.widgets = Object.entries(
            widgets)
            .map(([app, widgets]) =>
                widgets.map(widget => `<option value="${app}/${widget.name}" ${`${app}/${widget.name}` === this.header ? "selected" : ""}>${app}/${widget.name}</option>`))
            .flat(2)
            .join('');

        this.footers = Object.entries(
            widgets)
            .map(([app, widgets]) =>
                widgets.map(widget => `<option value="${app}/${widget.name}" ${`${app}/${widget.name}` === this.footer ? "selected" : ""}>${app}/${widget.name}</option>`))
            .flat(2)
            .join('');

        const agents = await personalityModule.getAgents(this.spaceId)
        this.personalitiesOptions = (agents||[]).map(personality => `<option value="${personality.id}" ${this.agent === personality.id ? "selected" : ""}>${personality.name}</option>`).join('');

        const themes = await WebAssistant.getThemes(this.spaceId);
        this.themes = (themes|| []).map(theme => `<option value="${theme.id}" ${this.theme === theme.id ? "selected" : ""}>${theme.name}</option>`).join('');
    }

    async afterRender() {

    }

    async saveSettings(eventTarget) {
        const form = this.element.querySelector('.application-form');
        let formData = await assistOS.UI.extractFormInformation(form);

        const initialPrompt = this.element.querySelector('#initial-prompt').value;
        const chatIndications = this.element.querySelector('#chat-indications').value;
        const knowledge = this.element.querySelector('#knowledge').value;
        if (formData.isValid) {
            const settingsData = {
                knowledge: knowledge,
                themeId: formData.data.selectedTheme,
                agentId: formData.data.selectedPersonality,
                header: formData.data.selectedHeader,
                footer: formData.data.selectedFooter,
                chatIndications: chatIndications,
                initialPrompt: initialPrompt
            }
            await WebAssistant.updateSettings(this.spaceId, settingsData);
            this.invalidate();
        }
    }

}
const personalityModule = assistOS.loadModule("agent",{});
const applicationModule = assistOS.loadModule("application",{});
const WebAssistant = assistOS.loadModule("webassistant",{});


const getWidgets = async function (spaceId) {
    const widgets = await applicationModule.getWidgets(spaceId);
    return widgets;
}

const getPersonalities = async function (spaceId) {
    const personalities = await personalityModule.getAgents(spaceId);
    return personalities;
}
const getConfiguration = async function (spaceId) {
    const configuration = await WebAssistant.getWebAssistantConfiguration(spaceId)
    return configuration;
}

const getThemes = async function (spaceId) {
    const themes = await WebAssistant.getWebAssistantThemes(spaceId);
    return themes;
}


export class ApplicationCreatorSettings {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Settings"
        this.spaceId = assistOS.space.id
        this.invalidate();
    }

    async beforeRender() {
        const {settings} = await getConfiguration(this.spaceId);

        this.color = settings.primaryColor;
        this.textColor = settings.textColor;
        this.initialPrompt = settings.initialPrompt;
        this.chatIndications = settings.chatIndications;
        this.theme = settings.theme;
        this.personality = settings.personality;
        this.knowledge = settings.knowledge;
        this.header = settings.header;
        this.footer = settings.footer;

        const widgets = await getWidgets(this.spaceId);

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

        this.personalitiesOptions = (await getPersonalities(this.spaceId)).map(personality => `<option value="${personality.id}" ${this.personality === personality.id ? "selected" : ""}>${personality.name}</option>`).join('');
        this.themes = (await getThemes(this.spaceId)).map(theme => `<option value="${theme.id}" ${this.theme === theme.id ? "selected" : ""}>${theme.name}</option>`).join('');
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
                primaryColor: formData.data.color,
                textColor: formData.data["text-color"],
                knowledge: knowledge,
                theme: formData.data.selectedTheme,
                personality: formData.data.selectedPersonality,
                header: formData.data.selectedHeader,
                footer: formData.data.selectedFooter,
                chatIndications: chatIndications,
                initialPrompt: initialPrompt
            }
            await WebAssistant.updateWebAssistantConfigurationSettings(this.spaceId, settingsData);
            this.invalidate();
        }
    }

}
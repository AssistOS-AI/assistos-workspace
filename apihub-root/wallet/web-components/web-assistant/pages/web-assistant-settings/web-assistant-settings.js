const personalityModule = assistOS.loadModule("agent", {});
const WebAssistant = assistOS.loadModule("webassistant", {});

export class WebAssistantSettings {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Settings"
        this.spaceId = assistOS.space.id
        this.invalidate();
    }

    async beforeRender() {
        const webAssistant = await WebAssistant.getWebAssistant(this.spaceId);
        this.themeId = webAssistant.themeId;
        this.agent = webAssistant.agentName;
        const authSettings = {
            public:"Public",
            existingSpaceMembers:"Existing Space Members",
            newAndExistingSpaceMembers:"New and Existing Space Members"
        }
        this.authenticationOptions  = Object.entries(authSettings).map( ([auth,authName])=> {
            return `<option value="${auth}" ${webAssistant.authentication === auth ? "selected" : ""}>${authName}</option>`;
        }).join('');
        this.publicChecked = webAssistant.isPublic ? "checked" : "";
        const agents = await personalityModule.getAgents(this.spaceId)
        this.personalitiesOptions = (agents || []).map(personality => `<option value="${personality.id}" ${this.agent === personality.id ? "selected" : ""}>${personality.name}</option>`).join('');

        const themes = await WebAssistant.getThemes(this.spaceId);
        this.themes = (themes || []).map(theme => `<option value="${theme.id}" ${this.themeId === theme.id ? "selected" : ""}>${theme.name}</option>`).join('');
    }

    async afterRender() {

    }

    async saveSettings(eventTarget) {
        const form = this.element.querySelector('.application-form');
        let formData = await assistOS.UI.extractFormInformation(form);

       const authType = this.element.querySelector('#authentication').value;
        if (formData.isValid) {
            const webAssistantSettings = {
                themeId: formData.data.selectedTheme,
                agentName: formData.data.selectedPersonality,
                authentication: authType,
            }
            await WebAssistant.updateWebAssistant(this.spaceId, webAssistantSettings);
            this.invalidate();
        }
    }

}
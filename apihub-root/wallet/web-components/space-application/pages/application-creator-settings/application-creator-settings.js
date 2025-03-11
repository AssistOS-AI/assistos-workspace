const getWidgets = (id) => {
    return [
        "widget1",
        "widget2",
        "widget3",
        "widget4",
        "widget5",
        "widget6",
        "widget7",
        "widget8",
    ]
}

const getPersonalities = (id) => {
    return [
        {
            id: 1,
            name: "Personality 1"
        },
        {
            id: 2,
            name: "Personality 2"
        },
        {
            id: 3,
            name: "Personality 3"
        },
        {
            id: 4,
            name: "Personality 4"
        },
        {
            id: 5,
            name: "Personality 5"
        }
    ]
}

export class ApplicationCreatorSettings {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Settings"
        this.invalidate();
    }

    async beforeRender() {
        this.color = "#d0d0d0";
        this.textColor = "#000000";
        this.initialPrompt = "";
        this.knowledge = "";
        this.chatIndications = "";
        this.spaceId = assistOS.space.id;
        this.widgets = getWidgets().map(widget => `<option value="${widget}">${widget}</option>`).join('');
        this.personalitiesOptions = getPersonalities(this.spaceId).map(personality => `<option value="${personality.id}">${personality.name}</option>`).join('');
        this.themes = `<option value="light">Light</option><option value="dark">Dark</option>`;
    }

    async afterRender() {

    }

    async saveSettings(eventTarget) {
        console.log('saveSettings');
    }
}
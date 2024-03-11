export class AssistOS {
    constructor(configuration) {
        if (AssistOS.instance) {
            return AssistOS.instance;
        }
        this.configuration = configuration;
        const validationResults = this.validateConfiguration(configuration);
        if (!validationResults.status) {
            throw new Error(validationResults.errorMessage);
        }
        AssistOS.instance = this;
    }
    static getInstance(configuration) {
        if (!AssistOS.instance) {
            new AssistOS(configuration);
        }
        return AssistOS.instance;
    }
    validateConfiguration(configuration) {
        if (!configuration.UIConfiguration) {
            return {"status": false, "errorMessage": "UIConfiguration is missing"};
        }
        return {"status": true};
    }

    async boot() {
        const bootPromises = [
            (async () => {
                this.UIManager = await WebSkel.initialise(this.configuration.UIConfiguration);
            })(),
            (async () => {
                this.ApplicationsManager = await ApplicationManager.initialise(this.configuration.applicationsManagerConfig);
            })()
        ];

        await Promise.all(bootPromises);
    }

    async shutdown() {
    }

    async reboot() {
        await this.shutdown();
        await this.boot();
    }

}

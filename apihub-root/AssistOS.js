// import WebSkel from "./WebSkel/webSkel.js";

import {SpaceFactory} from "./wallet/client-factories/SpaceFactory.js";
import {StorageService} from "./wallet/client-services/StorageService.js";
import {RequestsFacade} from "./wallet/client-services/RequestsFacade.js";
class AssistOS {
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
        return AssistOS.instance;
    }
    static getInstance(configuration) {
        if (!AssistOS.instance) {
            new AssistOS(configuration);
        }
        return AssistOS.instance;
    }
    validateConfiguration(configuration) {
        /*if (!configuration.UIConfiguration) {
            return {"status": false, "errorMessage": "UIConfiguration is missing"};
        }*/
        return {"status": true};
    }

    async boot() {
        const bootPromises = [
          /*  (async () => {
                this.UIManager = await WebSkel.initialise(this.configuration.UIConfiguration);
            })(),
            (async () => {
                this.ApplicationsManager = await ApplicationManager.initialise(this.configuration.applicationsManagerConfig);
            })()*/
            (async () => {
                this.SpaceFactory = await new SpaceFactory();
            })(),
            (async () => {
                this.StorageService = await new StorageService();
            })(),
            (async () => {
                this.RequestsFacade = await new RequestsFacade();
            })()
        ];
        await Promise.all(bootPromises);
        return this;
    }

    async shutdown() {
    }

    async reboot() {
        await this.shutdown();
        await this.boot();
    }

}
export default  AssistOS;

import {WebSkel, StorageManager} from "./wallet/imports.js";

class System {
    constructor(configuration) {
        if (System.instance) {
            return System.instance;
        }
        this.configuration = configuration;
        const validationResults = this.validateConfiguration(configuration);
        if (!validationResults.status) {
            throw new Error(validationResults.errorMessage);
        }
        System.instance = this;
        return System.instance;
    }

    validateConfiguration(configuration) {
        /*if (!configuration.UIConfiguration) {
            return {"status": false, "errorMessage": "UIConfiguration is missing"};
        }*/
        return {"status": true};
    }

    async boot(uiConfigsPath) {
        const initialiseModules = async (configName) => {
            this[configName] = {};
            for (const obj of this.configuration[configName]) {
                const module = await import(obj.path);
                let service = new module[obj.name];
                const methodNames = Object.getOwnPropertyNames(module[obj.name].prototype)
                    .filter(method => method !== 'constructor');
                methodNames.forEach(methodName => {
                    this[configName][methodName] = service[methodName].bind(service);
                });
            }
        }
        this.UI = await WebSkel.initialise(uiConfigsPath);
        this.storage = new StorageManager();
        for (const storageService of this.configuration.storageServices) {
            const StorageServiceModule = await import(storageService.path);
            this.storage.addStorageService(storageService.name, new StorageServiceModule[storageService.name]());
        }
        const initialisePromises = [
            initialiseModules("services"),
            initialiseModules("factories")
        ];

        this.applications = {};
        this.initialisedApplications = new Set();
        for (const application of this.configuration.applications) {
            this.applications[application.name] = application;
        }
        this.defaultApplicationName = this.configuration.defaultApplicationName;
        await Promise.all(initialisePromises);
    }

    async shutdown() {
    }

    async reboot() {
        await this.shutdown();
        await this.boot();
    }
    async refresh(){
        /* ... */
        await this.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/announcements-page`);
    }

}

export default System;

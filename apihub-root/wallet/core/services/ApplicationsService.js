export class ApplicationsService {
    constructor() {
    }

    async installApplication(appName) {
        return await system.storage.installApplication(system.space.id, appName);
    }

    async uninstallApplication(appName) {
        let response = await system.storage.uninstallApplication(system.space.id, appName);
        if(response.status === 200){
            await system.space.deleteApplication(appName);
        }
        return response;
    }


    async changeApplicationLocation(appLocation, presenterParams) {
        let baseURL = `${system.space.id}/${system.currentApplicationName}`
        let webComponentPage = appLocation.split("/").slice(-1)[0];
        let completeURL = [baseURL, appLocation].join("/");
        await system.UI.changeToDynamicPage(webComponentPage, completeURL, presenterParams)
    }

    async initialiseApplication(appName) {

        system.initialisedApplications[appName] = await system.storage.getApplicationConfigs(system.space.id, appName);
        if (system.initialisedApplications[appName].manager) {
            let ManagerModule = await system.storage.getApplicationFile(system.space.id, appName, system.initialisedApplications[appName].manager.path)
            system.initialisedApplications[appName].manager = new ManagerModule[system.initialisedApplications[appName].manager.name](appName);
            await system.initialisedApplications[appName].manager.loadAppData?.();
        }

        for (let component of system.initialisedApplications[appName].components) {
            let index =  component.name.indexOf("-");
            let prefix = component.name.substring(0, index);
            component.name= component.name.substring(index + 1);
            component = {
                ...await system.storage.getApplicationComponent(system.space.id, appName,system.initialisedApplications[appName].componentsDirPath,component),
                ...component
            }
            component.name = prefix + "-" + component.name;
            system.UI.configs.components.push(component);
            await system.UI.defineComponent(component);
        }
    }

    async startApplication(appName, applicationLocation, isReadOnly) {
        const applicationContainer=document.querySelector("#page-content");

        if (document.querySelector("left-sidebar") === null) {
            applicationContainer.insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (appName === system.defaultApplicationName) {
            if(!applicationLocation){
                applicationLocation = ["announcements-page"];
            }
            await system.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/${applicationLocation.join("/")}`)
            return;
        }
        if (!system.initialisedApplications[appName]) {
            await system.UI.showLoading();
            await this.initialiseApplication(appName);
            system.UI.hideLoading();
        }
        try {
            await system.initialisedApplications[appName].manager.navigateToLocation(applicationLocation, isReadOnly);
        } catch (e) {
            console.error(`Encountered an Issue trying to navigate to ${applicationLocation} .Navigating to application entry point`);
            await system.UI.changeToDynamicPage(system.initialisedApplications[appName].entryPointComponent,
                `${system.space.id}/${appName}/${system.initialisedApplications[appName].entryPointComponent}`);
        } finally {
            system.currentApplicationName = appName;
        }
    }
}

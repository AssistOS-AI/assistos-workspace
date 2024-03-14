export class ApplicationsService {
    constructor() {
    }

    async installApplication(appName) {
        return await storageManager.installApplication(webSkel.currentUser.space.id, appName);
    }

    async uninstallApplication(appName) {
        let response = await storageManager.uninstallApplication(webSkel.currentUser.space.id, appName);
        if(response.status === 200){
            await webSkel.currentUser.space.deleteApplication(appName);
        }
        return response;
    }


    async changeApplicationLocation(appLocation, presenterParams) {
        let baseURL = `${webSkel.currentUser.space.id}/${webSkel.currentApplicationName}`
        let webComponentPage = appLocation.split("/").slice(-1)[0];
        let completeURL = [baseURL, appLocation].join("/");
        await webSkel.changeToDynamicPage(webComponentPage, completeURL, presenterParams)
    }

    async initialiseApplication(appName) {

        webSkel.initialisedApplications[appName] = await storageManager.getApplicationConfigs(webSkel.currentUser.space.id, appName);
        if (webSkel.initialisedApplications[appName].manager) {
            let ManagerModule = await storageManager.getApplicationFile(webSkel.currentUser.space.id, appName, webSkel.initialisedApplications[appName].manager.path)
            webSkel.initialisedApplications[appName].manager = new ManagerModule[webSkel.initialisedApplications[appName].manager.name](appName);
            await webSkel.initialisedApplications[appName].manager.loadAppData?.();
        }

        for (let component of webSkel.initialisedApplications[appName].components) {
            let index =  component.name.indexOf("-");
            let prefix = component.name.substring(0, index);
            component.name= component.name.substring(index + 1);
            component = {
                ...await storageManager.getApplicationComponent(webSkel.currentUser.space.id, appName,webSkel.initialisedApplications[appName].componentsDirPath,component),
                ...component
            }
            component.name = prefix + "-" + component.name;
            webSkel.configs.components.push(component);
            await webSkel.defineComponent(component);
        }
    }

    async startApplication(appName, applicationLocation, isReadOnly) {
        const applicationContainer=document.querySelector("#page-content");

        if (document.querySelector("left-sidebar") === null) {
            applicationContainer.insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (appName === webSkel.defaultApplicationName) {
            if(!applicationLocation){
                applicationLocation = ["announcements-page"];
            }
            await webSkel.changeToDynamicPage("space-configs-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/${applicationLocation.join("/")}`)
            return;
        }
        if (!webSkel.initialisedApplications[appName]) {
            await webSkel.showLoading();
            await this.initialiseApplication(appName);
            webSkel.hideLoading();
        }
        try {
            await webSkel.initialisedApplications[appName].manager.navigateToLocation(applicationLocation, isReadOnly);
        } catch (e) {
            console.error(`Encountered an Issue trying to navigate to ${applicationLocation} .Navigating to application entry point`);
            await webSkel.changeToDynamicPage(webSkel.initialisedApplications[appName].entryPointComponent,
                `${webSkel.currentUser.space.id}/${appName}/${webSkel.initialisedApplications[appName].entryPointComponent}`);
        } finally {
            webSkel.currentApplicationName = appName;
        }
    }
}

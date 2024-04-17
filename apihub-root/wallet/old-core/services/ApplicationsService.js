export class ApplicationsService {
    constructor() {
    }

    async installApplication(appName) {
        return await assistOS.storage.installApplication(assistOS.space.id, appName);
    }

    async uninstallApplication(appName) {
        let response = await assistOS.storage.uninstallApplication(assistOS.space.id, appName);
        if(response.status === 200){
            await assistOS.space.deleteApplication(appName);
        }
        return response;
    }


    async changeApplicationLocation(appLocation, presenterParams) {
        let baseURL = `${assistOS.space.id}/${assistOS.currentApplicationName}`
        let webComponentPage = appLocation.split("/").slice(-1)[0];
        let completeURL = [baseURL, appLocation].join("/");
        await assistOS.UI.changeToDynamicPage(webComponentPage, completeURL, presenterParams)
    }

    async initialiseApplication(appName) {

        assistOS.initialisedApplications[appName] = JSON.parse(await assistOS.storage.getApplicationConfigs(assistOS.space.id, appName));
        if (assistOS.initialisedApplications[appName].manager) {
            let ManagerModule = await assistOS.storage.getApplicationFile(assistOS.space.id, appName, assistOS.initialisedApplications[appName].manager.path)
            assistOS.initialisedApplications[appName].manager = new ManagerModule[assistOS.initialisedApplications[appName].manager.name](appName);
            await assistOS.initialisedApplications[appName].manager.loadAppData?.();
        }

        for (let component of assistOS.initialisedApplications[appName].components) {
            // let index =  component.name.indexOf("-");
            // let prefix = component.name.substring(0, index);
            // component.name= component.name.substring(index + 1);
            component = {
                ...await this.getApplicationComponent(assistOS.space.id, appName,assistOS.initialisedApplications[appName].componentsDirPath,component),
                ...component
            }
            //component.name = prefix + "-" + component.name;
            assistOS.UI.configs.components.push(component);
            await assistOS.UI.defineComponent(component);
        }
    }
    async getApplicationComponent(spaceId, appId, appComponentsDirPath, component) {
        const HTMLPath = `${appComponentsDirPath}/${component.name}/${component.name}.html`
        const CSSPath = `${appComponentsDirPath}/${component.name}/${component.name}.css`
        let loadedTemplate = await (await assistOS.storage.getApplicationFile(spaceId, appId, HTMLPath)).text();
        let loadedCSSs = await (await assistOS.storage.getApplicationFile(spaceId, appId, CSSPath)).text();
        let presenterModule = "";
        if (component.presenterClassName) {
            const PresenterPath = `${appComponentsDirPath}/${component.name}/${component.name}.js`
            presenterModule = await assistOS.storage.getApplicationFile(spaceId, appId, PresenterPath);
        }
        loadedCSSs = [loadedCSSs];
        return {loadedTemplate, loadedCSSs, presenterModule};
    }

    async startApplication(appName, applicationLocation, isReadOnly) {
        const applicationContainer=document.querySelector("#page-content");

        if (document.querySelector("left-sidebar") === null) {
            applicationContainer.insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (appName === assistOS.configuration.defaultApplicationName) {
            if(!applicationLocation){
                applicationLocation = ["announcements-page"];
            }
            await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/${applicationLocation.join("/")}`)
            return;
        }
        if (!assistOS.initialisedApplications[appName]) {
            await assistOS.UI.showLoading();
            await this.initialiseApplication(appName);
            assistOS.UI.hideLoading();
        }
        try {
            await assistOS.initialisedApplications[appName].manager.navigateToLocation(applicationLocation, isReadOnly);
        } catch (e) {
            console.error(`Encountered an Issue trying to navigate to ${applicationLocation} .Navigating to application entry point`);
            await assistOS.UI.changeToDynamicPage(assistOS.initialisedApplications[appName].entryPointComponent,
                `${assistOS.space.id}/${appName}/${assistOS.initialisedApplications[appName].entryPointComponent}`);
        } finally {
            assistOS.currentApplicationName = appName;
        }
    }
}

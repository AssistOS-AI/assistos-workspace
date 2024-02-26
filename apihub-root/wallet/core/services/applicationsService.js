export class ApplicationsService {
    constructor() {
    }

    async installApplication(appName) {
        return await storageManager.installApplication(webSkel.currentUser.space.id, appName, webSkel.currentUser.id);
    }

    async uninstallApplication(appName) {
        let response = await storageManager.uninstallApplication(webSkel.currentUser.space.id, appName, webSkel.currentUser.id);
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
            let ManagerModule = await storageManager.loadManager(webSkel.currentUser.space.id, appName, webSkel.initialisedApplications[appName].manager.path)
            webSkel.initialisedApplications[appName].manager = new ManagerModule[webSkel.initialisedApplications[appName].manager.name](appName);
            await webSkel.initialisedApplications[appName].manager.loadAppData?.();
        }
        for (const component of webSkel.initialisedApplications[appName].components) {
            let componentHTML = await (await storageManager.getApplicationFile(webSkel.currentUser.space.id, appName, component.componentPath)).text();
            const cssPaths = await Promise.all(
                component.cssPaths.map(cssPath =>
                    storageManager.getApplicationFile(webSkel.currentUser.space.id, appName, cssPath)
                        .then(response => response.text())
                )
            );
            await webSkel.defineComponent(component.componentName, componentHTML, {cssTexts: cssPaths}, true);
        }
        for (const presenter of webSkel.initialisedApplications[appName].presenters) {
            const PresenterModule = await storageManager.loadPresenter(webSkel.currentUser.space.id, appName, presenter.presenterPath);
            webSkel.registerPresenter(presenter.forComponent, PresenterModule[presenter.presenterName]);
        }
    }

    async startApplication(appName, applicationLocation) {
        const applicationContainer=document.querySelector("#page-content");

        if (document.querySelector("left-sidebar") === null) {
            applicationContainer.insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (appName === webSkel.defaultApplicationName) {

            let appLocation = applicationLocation || ["agent-page"];
            const presenter = appLocation[appLocation.length - 1]
            await webSkel.changeToDynamicPage(`${presenter}`, `${webSkel.currentUser.space.id}/SpaceConfiguration/${appLocation.join('/')}`)
            return;
        }
        if (!webSkel.initialisedApplications[appName]) {
            await webSkel.showLoading();
            await this.initialiseApplication(appName);
            webSkel.hideLoading();
        }
        try {
            await webSkel.initialisedApplications[appName].manager.navigateToLocation(applicationLocation);
        } catch (e) {
            console.error(`Encountered an Issue trying to navigate to ${applicationLocation} .Navigating to application entry point`);
            await webSkel.changeToDynamicPage(webSkel.initialisedApplications[appName].entryPointComponent,
                `${webSkel.currentUser.space.id}/${appName}/${webSkel.initialisedApplications[appName].entryPointComponent}`);
        } finally {
            //UILoader.spinner.close();
            //UILoader.spinner.remove();
            webSkel.currentApplicationName = appName;
        }
    }
}

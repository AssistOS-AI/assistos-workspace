export class ApplicationsService {
    constructor() {}

    async installApplication(appName) {
        await storageManager.installApplication(webSkel.currentUser.space.id, appName);
    }

    async uninstallApplication(appName) {
        await storageManager.uninstallApplication(webSkel.currentUser.space.id, appName);
        await webSkel.currentUser.space.deleteApplication(appName);
    }

    async reinstallApplication(appName) {
        await this.uninstallApplication(appName);
        await this.installApplication(appName);
    }

    async initialiseApplication(applicationId) {
        webSkel.initialisedApplications[applicationId] = await storageManager.getApplicationConfigs(webSkel.currentUser.space.id, applicationId);
        if (webSkel.initialisedApplications[applicationId].manager) {
            let ManagerModule = await storageManager.loadManager(webSkel.currentUser.space.id, applicationId, webSkel.initialisedApplications[applicationId].manager.path)
            webSkel.initialisedApplications[applicationId].manager = new ManagerModule[webSkel.initialisedApplications[applicationId].manager.name];
        }
        for (const component of webSkel.initialisedApplications[applicationId].components) {
            let componentHTML = await (await storageManager.getApplicationFile(webSkel.currentUser.space.id, applicationId, component.componentPath)).text();
            const cssPaths = await Promise.all(
                component.cssPaths.map(cssPath =>
                    storageManager.getApplicationFile(webSkel.currentUser.space.id, applicationId, cssPath)
                        .then(response => response.text())
                )
            );
            await webSkel.defineComponent(component.componentName, componentHTML, cssPaths, true);
        }
        for (const presenter of webSkel.initialisedApplications[applicationId].presenters) {
            const PresenterModule = await storageManager.loadPresenter(webSkel.currentUser.space.id, applicationId, presenter.presenterPath);
            webSkel.registerPresenter(presenter.forComponent, PresenterModule[presenter.presenterName]);
        }
    }

    async startApplication(applicationId, applicationLocation) {
        if (document.querySelector("left-sidebar") === null) {
            document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (applicationId === webSkel.defaultApplicationId) {
            let appLocation = applicationLocation || "agent-page";
            const presenter = appLocation[appLocation.length - 1]
            await webSkel.changeToDynamicPage(`${presenter}`, `${webSkel.currentUser.space.id}/SpaceConfiguration/${appLocation.join('/')}`)
            return;
        }
        if (!webSkel.initialisedApplications[applicationId]) {
            await this.initialiseApplication(applicationId);
        }
        try {
            await webSkel.initialisedApplications[applicationId].manager.navigateToLocation(applicationLocation);
        } catch (e) {
            console.error(`Encountered an Issue trying to navigate to ${applicationLocation} .Navigating to application entry point`);
            await webSkel.changeToDynamicPage(webSkel.initialisedApplications[applicationId].entryPointComponent,
                `${webSkel.currentUser.space.id}/${applicationId}/${webSkel.initialisedApplications[applicationId].entryPointComponent}`);
        }
    }
}

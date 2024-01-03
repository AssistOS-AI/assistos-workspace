export class ApplicationsService {
    constructor() {
    }

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
        if(document.querySelector("left-sidebar") === null) {
            document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (applicationId === "SpaceConfiguration") {
            let appLocation = applicationLocation || "agent-page";
            await webSkel.changeToDynamicPage(`${appLocation}`, `${webSkel.currentUser.space.id}/SpaceConfiguration/${appLocation}`)
            return;
        }
        if (!webSkel.initialisedApplications[applicationId]) {
            await this.initialiseApplication(applicationId);
        }
        await webSkel.changeToDynamicPage(webSkel.initialisedApplications[applicationId].entryPointComponent, `${webSkel.currentUser.space.id}/${applicationId}/${webSkel.initialisedApplications[applicationId].entryPointComponent}`);
    }
}

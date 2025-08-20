export async function initialiseApplication(appName)  {
    const applicationModule = assistOS.loadModule("application");
    assistOS.initialisedApplications[appName] = await applicationModule.getApplicationManifest(assistOS.space.id, appName);
    // for (let component of assistOS.initialisedApplications[appName].webComponents) {
    //     let alreadyLoadedComponent = assistOS.UI.configs.components.find(c => c.name === component.name);
    //     if (alreadyLoadedComponent) {
    //         continue;
    //     }
    //     component = {
    //         ...await getApplicationComponent(assistOS.space.id, appName, assistOS.initialisedApplications[appName].componentsDirPath, component),
    //         ...component
    //     }
    //     assistOS.UI.configs.components.push(component);
    //     await assistOS.UI.defineComponent(component);
    // }
}
export async function getApplicationComponent(spaceId, appId, appComponentsDirPath, component) {
    const applicationModule = assistOS.loadModule("application");
    const HTMLPath = `${appComponentsDirPath}/${component.name}/${component.name}.html`
    const CSSPath = `${appComponentsDirPath}/${component.name}/${component.name}.css`
    let loadedTemplate = await applicationModule.getApplicationFile(spaceId, appId, HTMLPath);
    let loadedCSSs = await applicationModule.getApplicationFile(spaceId, appId, CSSPath);
    let presenterModule = "";
    if (component.presenterClassName) {
        const PresenterPath = `${appComponentsDirPath}/${component.name}/${component.name}.js`
        presenterModule = await applicationModule.getApplicationFile(spaceId, appId, PresenterPath);
    }
    loadedCSSs = [loadedCSSs];
    return {loadedTemplate, loadedCSSs, presenterModule};
}
export async function navigateToLocation(appName, locationArray = []) {
    let entryPoint = assistOS.initialisedApplications[appName].entryPoint;
    if (locationArray.length === 0 || locationArray[0] === entryPoint) {
        const pageUrl = `${assistOS.space.id}/${appName}/${entryPoint}`;
        await assistOS.UI.changeToDynamicPage(entryPoint, pageUrl);
        return;
    }
    const webComponentName = locationArray[0];
    const pageUrl = `${assistOS.space.id}/${appName}/${locationArray.join("/")}`;
    await assistOS.UI.changeToDynamicPage(webComponentName, pageUrl);
}
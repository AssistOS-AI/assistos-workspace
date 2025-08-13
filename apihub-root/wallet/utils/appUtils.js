export async function initialiseApplication(appName)  {
    const applicationModule = assistOS.loadModule("application");
    assistOS.initialisedApplications[appName] = await applicationModule.getApplicationConfig(assistOS.space.id, appName);
    for (let component of assistOS.initialisedApplications[appName].components) {
        let alreadyLoadedComponent = assistOS.UI.configs.components.find(c => c.name === component.name);
        if (alreadyLoadedComponent) {
            continue;
        }
        component = {
            ...await assistOS.getApplicationComponent(assistOS.space.id, appName, assistOS.initialisedApplications[appName].componentsDirPath, component),
            ...component
        }
        assistOS.UI.configs.components.push(component);
        await assistOS.UI.defineComponent(component);
    }
}
export async function navigateToLocation(appName, locationArray = []) {
    let entryPoint = assistOS.initialisedApplications[appName].entryPointComponent;
    if (locationArray.length === 0 || locationArray[0] === entryPoint) {
        const pageUrl = `${assistOS.space.id}/${appName}/${entryPoint}`;
        await assistOS.UI.changeToDynamicPage(entryPoint, pageUrl);
        return;
    }
    if (locationArray[locationArray.length - 1] !== entryPoint) {
        console.error(`Invalid URL: URL must end with ${entryPoint}`);
        return;
    }
    const webComponentName = locationArray[locationArray.length - 1];
    const pageUrl = `${assistOS.space.id}/${appName}/${locationArray.join("/")}`;
    await assistOS.UI.changeToDynamicPage(webComponentName, pageUrl);
}
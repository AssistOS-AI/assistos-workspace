import selectionUtils from "../../web-components/document/pages/document-view-page/selectionUtils.js";
const applicationModule = require("assistos").loadModule("application", {});
async function openPlugin(componentName, type, context, presenter, selectionItemId) {
    if(selectionItemId){
        await selectionUtils.selectItem(true, selectionItemId, componentName, presenter);
    }
    let plugin = assistOS.plugins[type].find(p => p.component === componentName);
    await initializePlugin(plugin);
    if(plugin.type === "embedded"){
        highlightPlugin(type, componentName, presenter);
        let pluginContainer = presenter.element.querySelector(`.${type}-plugin-container`);
        let contextString = encodeURIComponent(JSON.stringify(context));
        pluginContainer.innerHTML = `<${componentName} data-context="${contextString}" data-presenter="${componentName}"></${componentName}>`;
    } else {
        await assistOS.UI.showModal(componentName, {
            context: encodeURIComponent(JSON.stringify(context)),
        }, true);
    }
    if(selectionItemId){
        await selectionUtils.deselectItem(selectionItemId, presenter);
    }
}
function highlightPlugin(type, componentName, presenter) {
    let highlightPluginClass = `${type}-highlight-plugin`;
    let highlightPlugin = presenter.element.querySelector(`.${highlightPluginClass}`);
    if(highlightPlugin){
        highlightPlugin.classList.remove(highlightPluginClass);
    }
    let pluginIcon = presenter.element.querySelector(`.plugin-circle.${componentName}`);
    pluginIcon.classList.add(highlightPluginClass);
}
async function initializePlugin(plugin) {
    if(plugin.applicationId && !plugin.initialized){
        plugin.initialized = true;
        await loadPluginComponent(plugin.applicationId, plugin.component, plugin.presenter);
    }
}
async function loadPluginComponent(appId, componentName, presenter) {
    let alreadyLoadedComponent = assistOS.UI.configs.components.find(c => c.name === componentName);
    if(alreadyLoadedComponent) {
        return;
    }
    let manifest = await applicationModule.getApplicationConfig(assistOS.space.id, appId);
    let component = await assistOS.getApplicationComponent(assistOS.space.id, appId, manifest.componentsDirPath, {
        name: componentName,
        presenterClassName: presenter,
    });
    component.presenterClassName = presenter;
    component.name = componentName;
    assistOS.UI.configs.components.push(component);
    await assistOS.UI.defineComponent(component);
}
function getContext(presenterElement) {
    return JSON.parse(decodeURIComponent(presenterElement.getAttribute("data-context")));
}
async function renderPluginIcons(containerElement, type) {
    let plugins = assistOS.plugins[type];
    for(let plugin of plugins){
        if(plugin.iconPresenter){
            await loadPluginComponent(plugin.applicationId, plugin.iconComponent, plugin.iconPresenter);
            let iconContainer = document.createElement("div");
            attachPluginTooltip(iconContainer, plugin, type);
            let iconContext = {icon: plugin.icon, plugin: plugin.component, type};
            let contextString = encodeURIComponent(JSON.stringify(iconContext));
            iconContainer.innerHTML += `<${plugin.iconComponent} data-context="${contextString}" data-presenter="${plugin.iconComponent}"></${plugin.iconComponent}>`;
            containerElement.appendChild(iconContainer);
        } else {
            let icon = await getPluginIcon(plugin);
            let containerDiv = document.createElement("div");
            containerDiv.innerHTML = `<img class="pointer black-icon" loading="lazy" src="${icon}" alt="icon">`;
            attachPluginTooltip(containerDiv, plugin, type);
            containerElement.appendChild(containerDiv);
        }
    }
}
function attachPluginTooltip(containerElement, plugin, type) {
    containerElement.classList.add("plugin-circle", plugin.component, "pointer");
    containerElement.setAttribute("data-local-action", `openPlugin ${type} ${plugin.component}`);
    let tooltip = document.createElement("div");
    tooltip.classList.add("plugin-name");
    tooltip.innerHTML = plugin.tooltip;
    containerElement.appendChild(tooltip);
    containerElement.addEventListener("mouseover", async ()=>{
        containerElement.querySelector(".plugin-name").style.display = "block";
    });
    containerElement.addEventListener("mouseout", async ()=>{
        containerElement.querySelector(".plugin-name").style.display = "none";
    });
}
async function getPluginIcon(plugin) {
    let pluginIcon = plugin.icon;
    if(plugin.applicationId){
        let svg = await applicationModule.getApplicationFile(assistOS.space.id, plugin.applicationId, plugin.icon);
        pluginIcon = `data:image/svg+xml;base64,${btoa(svg)}`;
    }
    return pluginIcon;
}
export default {
    openPlugin,
    getContext,
    renderPluginIcons,
    loadPluginComponent
}
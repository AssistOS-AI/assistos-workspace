import UIUtils from "../../web-components/document/pages/document-view-page/UIUtils.js";
const applicationModule = assistOS.loadModule("application", {});
async function openPlugin(componentName, type, context, presenter, selectionItemId, autoPin = false) {
    if(selectionItemId){
        await UIUtils.selectItem(true, selectionItemId, componentName, presenter);
    }
    let plugin = assistOS.space.plugins[type].find(p => p.component === componentName);
    await initializePlugin(plugin);
    highlightPlugin(type, componentName, presenter);
    if(plugin.type === "embedded"){
        let pluginContainer = presenter.element.querySelector(`.${type}-plugin-container`);
        let contextString = encodeURIComponent(JSON.stringify(context));
        pluginContainer.classList.add("plugin-open");
        pluginContainer.innerHTML = `<${componentName} data-pin="${autoPin}" class="assistos-plugin" data-context="${contextString}" data-presenter="${componentName}"></${componentName}>`;
    } else {
        await assistOS.UI.showModal(componentName, {
            context: encodeURIComponent(JSON.stringify(context)),
        }, true);
        removeHighlightPlugin(type, presenter);
    }
    if(selectionItemId){
        await UIUtils.deselectItem(selectionItemId, presenter);
    }
    let pluginElement = presenter.element.querySelector(componentName);
    let firstEditableItem = pluginElement.closest('[data-local-action^="editItem "]');
    pluginElement.addEventListener("click", () => {
        firstEditableItem.click();
    });
}
function removeHighlightPlugin(type, presenter) {
    let highlightPluginClass = `${type}-highlight-plugin`;
    let pluginIcon = presenter.element.querySelector(`.icon-container.${highlightPluginClass}`);
    pluginIcon.classList.remove(highlightPluginClass);
}
function highlightPlugin(type, componentName, presenter) {
    let highlightPluginClass = `${type}-highlight-plugin`;
    let highlightPlugin = presenter.element.querySelector(`.${highlightPluginClass}`);
    if(highlightPlugin){
        highlightPlugin.classList.remove(highlightPluginClass);
    }
    let pluginIcon = presenter.element.querySelector(`.icon-container.${componentName}`);
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
    let plugins = assistOS.space.plugins[type];
    for(let plugin of plugins){
        if(plugin.iconPresenter){
            await loadPluginComponent(plugin.applicationId, plugin.iconComponent, plugin.iconPresenter);
            let iconContainer = document.createElement("div");
            attachPluginTooltip(iconContainer, plugin, type, plugin.autoPin);
            let iconContext = {icon: plugin.icon, plugin: plugin.component, type};
            let contextString = encodeURIComponent(JSON.stringify(iconContext));
            iconContainer.innerHTML += `<${plugin.iconComponent} data-context="${contextString}" data-presenter="${plugin.iconComponent}"></${plugin.iconComponent}>`;
            containerElement.appendChild(iconContainer);
        } else {
            let icon = await getPluginIcon(plugin);
            let containerDiv = document.createElement("div");
            containerDiv.innerHTML = `<img class="pointer black-icon" loading="lazy" src="${icon}" alt="icon">`;
            attachPluginTooltip(containerDiv, plugin, type, plugin.autoPin);
            containerElement.appendChild(containerDiv);
        }
    }
}
function attachPluginTooltip(containerElement, plugin, type, autoPin = false) {
    containerElement.classList.add("icon-container", plugin.component, "pointer");
    containerElement.setAttribute("data-local-action", `openPlugin ${type} ${plugin.component} ${autoPin}`);
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
function renderPluginDefaultOptions(pluginElement){
    let defaultOptions = `
            <div class="options-container">
                <svg class="pointer pin" data-local-action="pinPlugin" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <path d="M11.9999 17V21M6.9999 12.6667V6C6.9999 4.89543 7.89533 4 8.9999 4H14.9999C16.1045 4 16.9999 4.89543 16.9999 6V12.6667L18.9135 15.4308C19.3727 16.094 18.898 17 18.0913 17H5.90847C5.1018 17 4.62711 16.094 5.08627 15.4308L6.9999 12.6667Z" stroke="#646464" stroke-width="2" stroke-linecap="round"></path>
                    </g>
                </svg>
                <img class="close-plugin pointer" data-local-action="closePlugin" src="./wallet/assets/icons/x-mark.svg" alt="close">
            </div>`
    pluginElement.insertAdjacentHTML("afterbegin", defaultOptions);
}
function pinPlugin(pin, pluginElement){
    let path = pin.querySelector('path');
    path.setAttribute("fill", "#646464");
    pluginElement.classList.add("pinned");
}
function unpinPlugin(pin, pluginElement){
    let path = pin.querySelector('path');
    path.setAttribute("fill", "");
    pluginElement.classList.remove("pinned");
}
export default {
    openPlugin,
    getContext,
    renderPluginIcons,
    loadPluginComponent,
    removeHighlightPlugin,
    renderPluginDefaultOptions,
    pinPlugin,
    unpinPlugin
}
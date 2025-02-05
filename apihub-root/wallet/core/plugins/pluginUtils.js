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
    if(plugin.applicationId && !plugin.inialized){
        let alreadyLoadedComponent = assistOS.UI.configs.components.find(c => c.name === plugin.component);
        if(alreadyLoadedComponent) {
            plugin.inialized = true;
        } else {
            let manifest = await applicationModule.getApplicationConfig(assistOS.space.id, plugin.applicationId);
            let component = await assistOS.getApplicationComponent(assistOS.space.id, plugin.applicationId, manifest.componentsDirPath, {
                name: plugin.component,
                presenterClassName: plugin.presenter,
            });
            component.presenterClassName = plugin.presenter;
            component.name = plugin.component;
            assistOS.UI.configs.components.push(component);
            await assistOS.UI.defineComponent(component);
            plugin.inialized = true;
        }
    }
}
function getContext(presenterElement) {
    return JSON.parse(decodeURIComponent(presenterElement.getAttribute("data-context")));
}
async function renderPluginIcons(containerElement, type) {
    let plugins = assistOS.plugins[type];
    let pluginIconPromises = [];
    for(let plugin of plugins){
        pluginIconPromises.push(getPluginIcon(plugin));
    }
    let icons = await Promise.all(pluginIconPromises);
    for(let i = 0 ; i < plugins.length; i++){
        let icon = icons[i];
        let containerDiv = document.createElement("div");
        containerDiv.classList.add("plugin-circle", plugins[i].component);
        containerDiv.setAttribute("data-local-action", `openPlugin ${type} ${plugins[i].component}`);
        containerDiv.innerHTML = `<img class="pointer black-icon" loading="lazy" src="${icon}" alt="icon">
                                  <div class="plugin-name">${plugins[i].tooltip}</div>`;
        containerDiv.addEventListener("mouseover", async ()=>{
            containerDiv.querySelector(".plugin-name").style.display = "block";
        });
        containerDiv.addEventListener("mouseout", async ()=>{
            containerDiv.querySelector(".plugin-name").style.display = "none";
        });
        containerElement.appendChild(containerDiv);
    }
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
    renderPluginIcons
}
import selectionUtils from "../../web-components/document/pages/document-view-page/selectionUtils.js";
const applicationModule = require("assistos").loadModule("application", {});
async function openPlugin(componentName, type, context, selectionItemId, presenter) {
    if(selectionItemId){
        await selectionUtils.selectItem(true, selectionItemId, componentName, presenter);
    }
    await initializePlugin(type, componentName);
    await assistOS.UI.showModal(componentName, {
        context: encodeURIComponent(JSON.stringify(context)),
    }, true);
    if(selectionItemId){
        await selectionUtils.deselectItem(selectionItemId, presenter);
    }
}
async function initializePlugin(type, componentName) {
    let plugin = assistOS.plugins[type].find(p => p.componentName === componentName);
    if(plugin.applicationId && !plugin.inialized){
        let alreadyLoadedComponent = assistOS.UI.configs.components.find(c => c.name === componentName);
        if(alreadyLoadedComponent) {
            plugin.inialized = true;
        } else {
            let manifest = await applicationModule.getApplicationConfig(assistOS.space.id, plugin.applicationId);
            let component = await assistOS.getApplicationComponent(assistOS.space.id, plugin.applicationId, manifest.componentsDirPath, {
                name: componentName,
                presenterClassName: plugin.presenterClassName,
            });
            component.presenterClassName = plugin.presenterClassName;
            component.name = componentName;
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
        containerDiv.classList.add("plugin-circle", plugins[i].componentName);
        containerDiv.setAttribute("data-local-action", `openPlugin ${type} ${plugins[i].componentName}`);
        containerDiv.innerHTML = `<img class="pointer black-icon" loading="lazy" src="${icon}" alt="icon">
                                  <div class="plugin-name">${plugins[i].name}</div>`;
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
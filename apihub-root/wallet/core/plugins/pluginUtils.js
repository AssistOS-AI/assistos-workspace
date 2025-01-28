import selectionUtils from "../../web-components/document/pages/document-view-page/selectionUtils.js";

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
            let component = await assistOS.getApplicationComponent(assistOS.space.id, plugin.applicationId, componentName);
            assistOS.UI.configs.components.push(component);
            await assistOS.UI.defineComponent(component);
            plugin.inialized = true;
        }
    }
}
function getContext(presenterElement) {
    return JSON.parse(decodeURIComponent(presenterElement.getAttribute("data-context")));
}
export default {
    openPlugin,
    getContext
}
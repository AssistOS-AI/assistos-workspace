import {
    WebSkel,
    closeModal,
    StorageManager,
    DocumentFactory, getClosestParentElement
} from "./imports.js";

window.webSkel = new WebSkel();
window.mainContent = document.querySelector("#app-wrapper");

async function loadPage() {

    let url = window.location.hash;
    if(url === "" || url === null || url === "#space/agent-page") {
        let agent = "space/agent-page";
        url = "#space/agent-page";
        const content = `<${agent} data-presenter="${agent}"></${agent}>`;
        history.replaceState({agent, relativeUrlContent: content}, url, url);
        window.location.replace("#space/agent-page");
    }
    let leftSidebar = document.querySelector("left-sidebar");
    let leftSidebarPlaceholder = document.querySelector(".left-sidebar-placeholder");
    let presenterName;
    const documents = "#documents", authentication = "#authentication-page", space = "#space", chatbots = "#chatbots-page";
    /* URL examples: documents/0, documents/0/chapters/1 */
    let splitUrl = url.split('/');
    switch(splitUrl[0]) {
        case documents: {
            leftSidebar.style.visibility = "visible";
            leftSidebarPlaceholder.style.display = "none";
            let documentIdURL = splitUrl[1];
            presenterName = splitUrl[2];
            let chapterIdURL = splitUrl[3];
            let paragraphIdURL = splitUrl[4];
            if (await storageManager.loadObject(webSkel.currentUser.space.id, "documents", documentIdURL) !== null) {
                webSkel.currentUser.space.currentDocumentId = documentIdURL;
                webSkel.currentUser.space.currentChapterId = chapterIdURL;
                webSkel.currentUser.space.currentParagraphId = paragraphIdURL;
            }
            //changeSelectedPageFromSidebar("documents-page");
            break;
        }
        case authentication:{
            leftSidebarPlaceholder.style.display = "none";
            presenterName = url.slice(1);
            break;
        }
        case space:{
            leftSidebar.style.visibility = "visible";
            leftSidebarPlaceholder.style.display = "none";
            //changeSelectedPageFromSidebar("agent-page");
            let editPers = "edit-personality-page";
            let appPage = "application-page";
            if(splitUrl[2] === editPers || splitUrl[2] === appPage){
                presenterName = splitUrl[2];
            }else {
                presenterName = splitUrl[1];
            }
            break;
        }
        case chatbots:{
            leftSidebar.style.visibility = "visible";
            leftSidebarPlaceholder.style.display = "none";
            //changeSelectedPageFromSidebar("chatbots-page");
            presenterName = splitUrl[0];
            presenterName = presenterName.slice(1);
            break;
        }
        default: {
            /*#proofReader, #documents */
            leftSidebar.style.visibility = "visible";
            leftSidebarPlaceholder.style.display = "none";
            //changeSelectedPageFromSidebar(url);
            presenterName = url.slice(1);
            webSkel.currentUser.space.currentDocumentId = null;
            webSkel.currentUser.space.currentChapterId = null;
            webSkel.currentUser.space.currentParagraphId = null;
            break;
        }
    }

    //await webSkel.startApplication(applicationId);
    changeSelectedPageFromSidebar(url);
    await webSkel.changeToDynamicPage(presenterName, url.slice(1));
    let pagePlaceholder = document.querySelector("#page-placeholder");
    if(pagePlaceholder){
        pagePlaceholder.style.display = "none";
    }
}

export function changeSelectedPageFromSidebar(url) {
    let element = document.getElementById('selected-page');
    if (element) {
        element.removeAttribute('id');
        let paths = element.querySelectorAll("path");
        paths.forEach((path)=>{
            path.setAttribute("fill", "white");
        });
    }
    let divs = document.querySelectorAll('div[data-local-action]');
    let targetAction = url;
    if(targetAction.startsWith("#")) {
        targetAction = url.slice(1);
    }
    divs.forEach(div => {
        let dataAction = div.getAttribute('data-local-action');
        if (dataAction.includes(targetAction)) {
            console.log(`Element with data-action '${targetAction}' found.`);
            div.setAttribute('id', 'selected-page');
            let paths = div.querySelectorAll("path");
            paths.forEach((path)=>{
                path.setAttribute("fill", "var(--left-sidebar)");
            });
        }
    });
}

function defineActions() {
    webSkel.registerAction("closeErrorModal", async (_target) => {
        closeModal(_target);
    });
}

async function loadConfigs(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        const config = await response.json();

        for (const service of config.services) {
            const ServiceModule = await import(service.path);
            webSkel.initialiseService(service.name, ServiceModule[service.name]);
        }
        for( const storageService of config.storageServices){
            const StorageServiceModule=await import(storageService.path);
            if(storageService.params) {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name](...Object.values(storageService.params)));
            } else {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name]());
            }
        }
        for( const application of config.applications){
            webSkel.applications.push(application);
        }
        storageManager.setCurrentService("FileSystemStorage");
        await webSkel.getService("AuthenticationService").initUser();
        for (const presenter of config.presenters) {
            const PresenterModule = await import(presenter.path);
            webSkel.registerPresenter(presenter.name, PresenterModule[presenter.className]);
        }
        for (const component of config.components) {
            await webSkel.defineComponent(component.name, component.path,component.cssPaths);
        }
    } catch (error) {
        console.error(error);
        await showApplicationError("Error loading configs", "Error loading configs", `Encountered ${error} while trying loading webSkel configs`);
    }
}
async function handleHistory(event){
    const result = webSkel.getService("AuthenticationService").getCachedCurrentUser();
    if(!result){
        if(window.location.hash !== "#authentication-page"){
            webSkel.setDomElementForPages(mainContent);
            window.location.hash = "#authentication-page";
            await webSkel.changeToDynamicPage("authentication-page", "authentication-page", "", true);
        }
    }else {
        if(history.state){
            if(history.state.pageHtmlTagName === "authentication-page"){
                const path = ["#", webSkel.currentState.pageHtmlTagName].join("");
                history.replaceState(webSkel.currentState, path, path);
            }
        }
    }
    let modal = document.querySelector("dialog");
    if(modal){
        closeModal(modal);
    }
}
function saveCurrentState(){
    webSkel.currentState = Object.assign({}, history.state);
}

(async ()=> {
    await webSkel.defineComponent("general-loader", "./wallet/web-components/components/general-loader/general-loader.html");
    await webSkel.UtilsService.initialize();
    const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    window.storageManager = new StorageManager();
    window.documentFactory = new DocumentFactory();
    await loadConfigs("./wallet/webskel-configs.json");
    await loadPage();
    defineActions();
    loading.close();
    loading.remove();
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);
})();
import AppManager from "./app-manager.js";
import { extractFormInformation, checkValidityFormInfo } from "./utils/form-utils.js";
import { closeModal, showModal } from "./utils/modal-utils.js";
import { getAppUrl } from "./utils/url-utils.js";

function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}
const defineComponent = async (componentName, templatePath) => {
    let template = await (await fetch(getAppUrl(templatePath))).text();
    customElements.define(
        componentName,
        class extends HTMLElement {
            constructor() {
                super();
            }

            async connectedCallback() {
                let content=template;
                Array.from(this.attributes).forEach(attr => {
                    let textSanitized=sanitize(attr.nodeValue);
                    content=content.replaceAll(`$$${attr.nodeName}`,textSanitized);
                })
                this.innerHTML = content;
            }
        }
    );
};

const appManager = new AppManager();
window.appManager = appManager;

// Actions that can be used from apihub-components controllers can be defined here
appManager.registerAction("showInfoModal", async (...params) => {
    await showModal(appManager.element, "info-modal", {});
});

appManager.registerAction("showAddBrandModal", async (...params) => {
    await showModal(appManager.element, "add-brand-modal", {});
})

appManager.registerAction("showAddPostModal", async (...params) => {
    await showModal(appManager.element, "add-post-modal", {});
})

appManager.registerAction("showAddCommentModal", async (_target,postId) => {
    appManager.currentPost = postId;
    await showModal(appManager.element, "add-comment-modal", {});
})

appManager.registerAction("closeModal", async (modal,_param) => {
    closeModal(modal);
});

appManager.registerAction("savePost", async (...params) => {
    const result = await $$.promisify(appManager.remoteEnclaveClient.callLambda)("helloWorld", "param1", "param2");
    console.log("Results from remote enclave: ", result);
})

appManager.registerAction("submitFormSample", async (formElement,_param) => {
    const formInfo = await extractFormInformation(formElement);
    console.log("form isValid", formInfo.isValid);
    console.log("form data", formInfo.data);
    console.log("form elements", formInfo.elements);
});

appManager.registerAction("createBrand", async (formElement,_param) => {
    const formInfo = await extractFormInformation(formElement);
    console.log(formInfo)
    if(checkValidityFormInfo(formInfo)) {
        const result = await $$.promisify(appManager.remoteEnclaveClient.callLambda)
        ("addNewBrand", formInfo.data.name, formInfo.data.logo, formInfo.data.description , formInfo.data.url);
        console.log("Added new brand ", result);
        closeModal(formElement);
        appManager.currentBrandId = JSON.parse(result).pk;
        appManager.loadSidebar();
        appManager.navigateToPostsPage();

        const userId="1";
        const resultFollow = await $$.promisify(appManager.remoteEnclaveClient.callLambda)
        ("addNewBrandFollow", JSON.parse(result).brand.brandId, userId);
    }
})

appManager.registerAction("createPost", async (formElement,_param) => {
    const formInfo = await extractFormInformation(formElement);
    if(checkValidityFormInfo(formInfo)) {
        const result = await $$.promisify(appManager.remoteEnclaveClient.callLambda)
        ("addNewPost", appManager.currentBrandId, formInfo.data.title, "noImage", formInfo.data.body, "hardcodedDID", formInfo.data.mintingFee);
        console.log("Added new post ", result);

        closeModal(formElement);
        location.reload();
    }
})

appManager.registerAction("createComment", async (formElement,_param) => {
    const formInfo = await extractFormInformation(formElement);
    console.log(formInfo, appManager.currentPost)
    if(checkValidityFormInfo(formInfo)) {
        const result = await $$.promisify(appManager.remoteEnclaveClient.callLambda)
        ("addNewComment", appManager.currentBrandId, appManager.currentPost, formInfo.data.title, formInfo.data.comment, "hardcodedDID", formInfo.data.mintingFee);
        console.log("Added new comment ", result);
        location.reload();
    }
})

appManager.registerAction("changeBrand", async (_target,brandId) => {
    console.log(brandId);
    appManager.currentBrandId = brandId;
    appManager.navigateToPostsPage();
})

appManager.registerAction("navigateToPostPage", async (_target,postId) => {
    appManager.currentPost = postId;
    appManager.navigateToPostPage();
})

appManager.registerAction("toggleBrandFollow", async (_target,brandId,mode) => {
    let userId="1";//static user
    if(mode === "followed") {
        const result = await $$.promisify(appManager.remoteEnclaveClient.callLambda)
        ("removeBrandFollow", brandId);
    }
    else {
        const result = await $$.promisify(appManager.remoteEnclaveClient.callLambda)
        ("addNewBrandFollow", brandId, userId);
    }
    appManager.loadSidebar();
})
appManager.init();

// Modal components defined here
// defineComponent("info-modal", "/components/info-modal/info-modal.html");
// defineComponent("add-post-modal", "/components/add-post-modal/add-post-modal.html");
// defineComponent("add-brand-modal", "/components/add-brand-modal/add-brand-modal.html");
// defineComponent("add-comment-modal", "/components/add-comment-modal/add-comment-modal.html");
//
// defineComponent("post-card", "/components/post-card/post-card.html");
// defineComponent("comment-card", "/components/comment-card/comment-card.html");
// defineComponent("brand-card", "/components/brand-card/brand-card.html");
// defineComponent("add-comment-card", "/components/comment-card/add-comment-card.html");

defineComponent("tool-card", "/components/tool-card/tool-card.html");
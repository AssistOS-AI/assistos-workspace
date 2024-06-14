//Models
import {PageModel} from "./core/models/PageModel.js";

export {
    PageModel,
};

// Others
import {
    getDemoUserCredentials,
    getCursorPositionTextIndex,
    insertTextAtCursor,
    saveCaretPosition,
    base64ToBlob,
    blobToBase64,
    executeTimer
} from "./utils/utils.js";
import {validateOpenAiKey} from "./utils/OpenAiUtils/validateAPIKey.js";
import WebSkel from "../WebSkel/webSkel.js";
import {changeSelectedPageFromSidebar} from "../AssistOS.js";

export {
    getDemoUserCredentials,
    getCursorPositionTextIndex,
    insertTextAtCursor,
    saveCaretPosition,
    base64ToBlob,
    blobToBase64,
    executeTimer,
    validateOpenAiKey,
    changeSelectedPageFromSidebar,
    WebSkel
};
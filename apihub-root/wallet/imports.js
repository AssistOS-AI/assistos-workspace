
// Others
import {
    getDemoUserCredentials,
    insertTextAtCursor,
    base64ToBlob,
    executorTimer,
    unescapeHtmlEntities,
    generateId
} from "./utils/utils.js";
import {validateOpenAiKey} from "./utils/OpenAiUtils/validateAPIKey.js";
import WebSkel from "../WebSkel/webSkel.js";
import {changeSelectedPageFromSidebar} from "../AssistOS.js";
import NotificationRouter from "./core/NotificationRouter.js";
//mediaPlayers
import CustomAudio from "./core/media/CustomAudio.js";
import videoUtils from "./core/media/videoUtils.js";
export {
    getDemoUserCredentials,
    insertTextAtCursor,
    base64ToBlob,
    executorTimer,
    unescapeHtmlEntities,
    validateOpenAiKey,
    changeSelectedPageFromSidebar,
    WebSkel,
    NotificationRouter,
    generateId,
    CustomAudio,
    videoUtils
};
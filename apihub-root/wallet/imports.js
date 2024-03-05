// Models
import { Chapter } from "./core/models/Chapter.js";
import { DocumentModel } from "./core/models/DocumentModel.js";
import { Personality } from "./core/models/Personality.js";
import { User } from "./core/models/User.js";
import { Announcement } from "./core/models/Announcement.js";
import { Paragraph } from "./core/models/Paragraph.js";
import { Space } from "./core/models/Space.js";
import { Settings } from "./core/models/Settings.js";
import { Flow } from "./core/models/Flow.js";
import { Agent } from "./core/models/Agent.js";
import {PageModel} from "./core/models/PageModel.js";
import {Application} from "./core/models/Application.js";

export {
    Chapter,
    DocumentModel,
    Personality,
    User,
    Announcement,
    Paragraph,
    Space,
    Settings,
    Flow,
    Agent,
    PageModel,
    Application,
};

// Services
import { StorageManager } from "./core/services/StorageManager.js";

export{
    StorageManager
}
// Factories
import {DocumentFactory} from "./core/factories/documentFactory.js";
import {SpaceFactory} from "./core/factories/spaceFactory.js";

export {
    DocumentFactory,
    SpaceFactory
}


// Others
import {SaveElementTimer} from "./utils/saveElementTimer.js";
import {validateOpenAiKey}  from "./utils/OpenAiUtils/validateAPIKey.js";
import {parseURL} from "./utils/parseURL.js";
import WebSkel from "../WebSkel/webSkel.js";
import { changeSelectedPageFromSidebar } from "./main.js";

export {
    parseURL,
    SaveElementTimer,
    validateOpenAiKey,
    WebSkel
};

// WebSkel Utilities
import { closeModal, showActionBox, showModal, removeActionBox } from "../WebSkel/utils/modal-utils.js";
import { notBasePage, getClosestParentElement, sanitize,unsanitize, reverseQuerySelector,customTrim, moveCursorToEnd,getClosestParentWithPresenter,refreshElement } from "../WebSkel/utils/dom-utils.js";
import { extractFormInformation } from "../WebSkel/utils/form-utils.js";
import { decodeBase64 } from "../WebSkel/utils/template-utils.js";

export {
    closeModal,
    showActionBox,
    showModal,
    removeActionBox,
    notBasePage,
    getClosestParentElement,
    extractFormInformation,
    sanitize,
    unsanitize,
    reverseQuerySelector,
    customTrim,
    moveCursorToEnd,
    getClosestParentWithPresenter,
    refreshElement,
    changeSelectedPageFromSidebar,
    decodeBase64
};
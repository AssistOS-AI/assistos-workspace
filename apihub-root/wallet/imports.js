// Models
import { Chapter } from "./core/models/chapter.js";
import { DocumentModel } from "./core/models/documentModel.js";
import { Personality } from "./core/models/personality.js";
import { User } from "./core/models/user.js";
import { Announcement } from "./core/models/announcement.js";
import { Paragraph } from "./core/models/paragraph.js";
import { Space } from "./core/models/space.js";
import { Settings } from "./core/models/settings.js";
import { Flow } from "./core/models/flow.js";
import { Agent } from "./core/models/agent.js";
import {PageModel} from "./core/models/pageModel.js";
import {Application} from "./core/models/application.js";

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
import { StorageManager } from "./core/services/storageManager.js";

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
import { llmsPage } from "./presenters/llms-page.js";
import { personalitiesPage } from "./presenters/personalities-page.js";
import { documentsPage } from "./presenters/documents-page.js";
import { docPageByTitle } from "./presenters/doc-page-by-title.js";
import { editTitlePage } from "./presenters/edit-title-page.js";
import { editAbstractPage } from "./presenters/edit-abstract-page.js";
import { proofReaderPage } from "./presenters/proof-reader-page.js";
import { myOrganisationPage } from "./presenters/my-organisation-page.js";
import { userDocument } from "./userDocument.js";
import { closeModal, showActionBox } from "../WebSkel/utils/modal-utils.js";
import {urlForPage} from "../WebSkel/utils/dom-utils.js"
import {getClosestParentElement} from "../WebSkel/utils/dom-utils.js";
import liteUserDatabase from "./liteUserDatabase.js";
import WebSkel from "../WebSkel/webSkel.js";

export {
    llmsPage,
    personalitiesPage,
    documentsPage,
    docPageByTitle,
    editTitlePage,
    editAbstractPage,
    proofReaderPage,
    myOrganisationPage,
    urlForPage,
    closeModal,
    showActionBox,
    getClosestParentElement,
    liteUserDatabase,
    userDocument,
    WebSkel
};
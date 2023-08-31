import { documentsPage } from "./presenters/pages/documents-page.js";
import { docPageByTitle } from "./presenters/pages/doc-page-by-title.js";
import { editTitlePage } from "./presenters/pages/edit-title-page.js";
import { editAbstractPage } from "./presenters/pages/edit-abstract-page.js";
import { proofReaderPage } from "./presenters/pages/proof-reader-page.js";
import { documentSettingsPage } from "./presenters/pages/document-settings-page.js";
import { addNewDocumentModal } from "./presenters/modals/add-new-document-modal.js";
import { editChapterPage } from "./presenters/pages/edit-chapter-page.js";
import { brainstormingPage } from "./presenters/pages/brainstorming-page.js";
import { closeModal, showActionBox,showModal} from "../WebSkel/utils/modal-utils.js";
import { notBasePage,getClosestParentElement } from "../WebSkel/utils/dom-utils.js";
import {localStorage} from "./core/services/localStorage.js";
import {Registry} from "./core/services/registry.js"
import {CurrentCompany} from "./core/services/currentCompany.js"
import {Chapter} from "./core/models/chapter.js";
import {Document} from "./core/models/document.js";
import {Paragraph} from "./core/models/paragraph.js";
import {Company} from "./core/company.js";
import {addRecord,getRecord,getAllRecords,getTableRecords,deleteRecord,openDatabase,updateRecord} from "./utils/indexDB.js";
import{PendingCallMixin} from "./utils/PendingCallMixin.js";
import WebSkel from "../WebSkel/webSkel.js";

export {
    documentsPage,
    docPageByTitle,
    editTitlePage,
    editAbstractPage,
    proofReaderPage,
    documentSettingsPage,
    addNewDocumentModal,
    editChapterPage,
    brainstormingPage,
    notBasePage,
    showModal,
    closeModal,
    showActionBox,
    getClosestParentElement,
    localStorage,
    Company,
    WebSkel,
    Registry,
    CurrentCompany,
    Chapter,
    Document,
    Paragraph,
    addRecord,
    getRecord,
    getAllRecords,
    getTableRecords,
    deleteRecord,
    openDatabase,
    updateRecord,
    PendingCallMixin
};
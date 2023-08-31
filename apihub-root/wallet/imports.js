import { documentsPage } from "./presenters/documents-page.js";
import { docPageByTitle } from "./presenters/doc-page-by-title.js";
import { editTitlePage } from "./presenters/edit-title-page.js";
import { editAbstractPage } from "./presenters/edit-abstract-page.js";
import { proofReaderPage } from "./presenters/proof-reader-page.js";
import { documentSettingsPage } from "./presenters/document-settings-page.js";
import { addNewDocumentModal } from "./presenters/add-new-document-modal.js";
import { editChapterPage } from "./presenters/edit-chapter-page.js";
import { brainstormingPage } from "./presenters/brainstorming-page.js";
import { closeModal, showActionBox, showModal} from "../WebSkel/utils/modal-utils.js";
import { notBasePage, getClosestParentElement } from "../WebSkel/utils/dom-utils.js";
import { localStorage } from "./core/services/localStorage.js";
import { DocumentsRegistry } from "./core/services/documentsRegistry.js"
import { CurrentCompany } from "./core/services/currentCompany.js"
import { Chapter } from "./core/models/chapter.js";
import { Document } from "./core/models/document.js";
import { Paragraph } from "./core/models/paragraph.js";
import { Company } from "./core/company.js";
import { addRecord, getRecord, getAllRecords, getTableRecords, deleteRecord } from "./utils/indexDB.js";
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
    DocumentsRegistry,
    CurrentCompany,
    Chapter,
    Document,
    Paragraph,
    addRecord,
    getRecord,
    getAllRecords,
    getTableRecords,
    deleteRecord
};
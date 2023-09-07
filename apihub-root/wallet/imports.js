import { addNewDocumentModal } from "./presenters/modals/add-new-document-modal.js";
import { showErrorModal } from "./presenters/modals/show-error-modal.js";
import { suggestAbstractModal } from "./presenters/modals/suggest-abstract-modal.js";
import { suggestTitleModal } from "./presenters/modals/suggest-title-modal.js"
import { documentsPage } from "./presenters/pages/documents-page.js";
import { docPageById } from "./presenters/pages/doc-page-by-id.js";
import { editTitlePage } from "./presenters/pages/edit-title-page.js";
import { editAbstractPage } from "./presenters/pages/edit-abstract-page.js";
import { proofReaderPage } from "./presenters/pages/proof-reader-page.js";
import { settingsPage } from "./presenters/pages/settings-page.js";
import { documentSettingsPage } from "./presenters/pages/document-settings-page.js";
import { editChapterPage } from "./presenters/pages/edit-chapter-page.js";
import { brainstormingPage } from "./presenters/pages/brainstorming-page.js";
import { closeModal, showActionBox } from "../WebSkel/utils/modal-utils.js";
import { notBasePage, getClosestParentElement } from "../WebSkel/utils/dom-utils.js";
import { storageService } from "./core/services/storageService.js";
import { Chapter } from "./core/models/chapter.js";
import { Document} from "./core/models/document.js";
import { Personality } from "./core/models/personality.js";
import { Paragraph } from "./core/models/paragraph.js";
import { Company } from "./core/company.js";
import { showModal } from "./utils/modal-utils.js";
import { chapterItem } from "./presenters/components/chapter-item.js";
import { addRecord, getRecord, getAllRecords, getTableRecords, deleteRecord, openDatabase, updateRecord } from "./utils/indexDB.js";
import WebSkel from "../WebSkel/webSkel.js";
import { initUser, registerAccountActions } from "./scripts/authentication.js";
import{ documentsService } from "./core/services/documentsService.js";
import{ llmsService} from "./core/services/llmsService.js";
import{ personalitiesService } from "./core/services/personalitiesService.js";
import{ settingsService } from "./core/services/settingsService.js";
export {
    documentsService,
    llmsService,
    personalitiesService,
    settingsService,
    addNewDocumentModal,
    showErrorModal,
    suggestAbstractModal,
    suggestTitleModal,
    documentsPage,
    docPageById,
    editTitlePage,
    editAbstractPage,
    proofReaderPage,
    settingsPage,
    documentSettingsPage,
    editChapterPage,
    chapterItem,
    brainstormingPage,
    notBasePage,
    showModal,
    closeModal,
    showActionBox,
    getClosestParentElement,
    storageService,
    Company,
    WebSkel,
    Chapter,
    Document,
    Personality,
    Paragraph,
    addRecord,
    getRecord,
    getAllRecords,
    getTableRecords,
    deleteRecord,
    openDatabase,
    updateRecord,
    initUser,
    registerAccountActions
};
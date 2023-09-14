import { addNewDocumentModal } from "./presenters/modals/add-new-document-modal.js";
import { addAnnounceModal } from "./presenters/modals/add-announce-modal.js";
import { addChapterModal } from "./presenters/modals/add-chapter-modal.js";
import { addLLMModal } from "./presenters/modals/add-llm-modal.js";
import { addPersonalityModal } from "./presenters/modals/add-personality-modal.js";
import { addUserModal } from "./presenters/modals/add-user-modal.js";
import { suggestAbstractModal } from "./presenters/modals/suggest-abstract-modal.js";
import { suggestTitleModal } from "./presenters/modals/suggest-title-modal.js"
import { documentsPage } from "./presenters/pages/documents-page.js";
import { docPageById } from "./presenters/pages/doc-page-by-id.js";
import { editTitlePage } from "./presenters/pages/edit-title-page.js";
import { chapterTitlePage } from "./presenters/pages/subpages/chapter-title-page.js";
import { chapterBrainstormingPage } from "./presenters/pages/subpages/chapter-brainstorming-page.js";
import { editAbstractPage } from "./presenters/pages/edit-abstract-page.js";
import { proofReaderPage } from "./presenters/pages/proof-reader-page.js";
import { myOrganizationPage } from "./presenters/pages/my-organization-page.js";
import { documentSettingsPage } from "./presenters/pages/document-settings-page.js";
import { brainstormingPage } from "./presenters/pages/brainstorming-page.js";
import { llmsPage } from "./presenters/pages/subpages/llms-page.js";
import { personalitiesPage } from "./presenters/pages/subpages/personalities-page.js";
import { announcesPage } from "./presenters/pages/subpages/announces-page.js";
import { usersPage } from "./presenters/pages/subpages/users-page.js";
import { closeModal, showActionBox } from "../WebSkel/utils/modal-utils.js";
import { notBasePage, getClosestParentElement } from "../WebSkel/utils/dom-utils.js";
import { storageService } from "./core/services/storageService.js";
import { Chapter } from "./core/models/chapter.js";
import { Document} from "./core/models/document.js";
import { Personality } from "./core/models/personality.js";
import { User } from "./core/models/user.js";
import { Paragraph } from "./core/models/paragraph.js";
import { Company } from "./core/company.js";
import { companyDropdown }  from "./presenters/components/company-dropdown.js";
import { showModal } from "./utils/modal-utils.js";
import { chapterItem } from "./presenters/components/chapter-item.js";
import { addRecord, getRecord, getAllRecords, getTableRecords, deleteRecord, openDatabase, updateRecord } from "./utils/indexDB.js";
import { initUser, registerAccountActions } from "./scripts/authentication.js";
import { documentService } from "./core/services/documentService.js";
import { chapterService } from "./core/services/chapterService.js";
import { llmsService } from "./core/services/llmsService.js";
import { personalitiesService } from "./core/services/personalitiesService.js";
import { usersService } from "./core/services/usersService.js";
import { settingsService } from "./core/services/settingsService.js";
import { brainstormingService }   from "./core/services/brainstormingService.js";
import { LLM } from "./core/models/llm.js";
import WebSkel from "../WebSkel/webSkel.js";
import {companyService} from "./core/services/companyService.js";
import { extractFormInformation } from "../WebSkel/utils/form-utils.js";
import { addCompanyModal} from "./presenters/modals/add-company-modal.js";
import { Settings } from "./core/models/settings.js";
export {
    Settings,
    documentService,
    addCompanyModal,
    chapterService,
    llmsService,
    personalitiesService,
    usersService,
    brainstormingService,
    settingsService,
    addNewDocumentModal,
    addAnnounceModal,
    addChapterModal,
    addLLMModal,
    addPersonalityModal,
    addUserModal,
    suggestAbstractModal,
    suggestTitleModal,
    documentsPage,
    docPageById,
    editTitlePage,
    companyDropdown,
    editAbstractPage,
    proofReaderPage,
    myOrganizationPage,
    documentSettingsPage,
    chapterTitlePage,
    chapterBrainstormingPage,
    chapterItem,
    brainstormingPage,
    llmsPage,
    personalitiesPage,
    announcesPage,
    usersPage,
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
    User,
    Paragraph,
    addRecord,
    getRecord,
    getAllRecords,
    getTableRecords,
    deleteRecord,
    openDatabase,
    updateRecord,
    initUser,
    registerAccountActions,
    LLM,
    extractFormInformation,
    companyService
};
import { addDocumentModal } from "./web-components/modals/add-document-modal/add-document-modal.js";
import { addAnnouncementModal } from "./web-components/modals/add-announcement-modal/add-announcement-modal.js";
import { addChapterModal } from "./web-components/modals/add-chapter-modal/add-chapter-modal.js";
import { addLLMModal } from "./web-components/modals/add-llm-modal/add-llm-modal.js";
import { addPersonalityModal } from "./web-components/modals/add-personality-modal/add-personality-modal.js";
import { addUserModal } from "./web-components/modals/add-user-modal/add-user-modal.js";
import { suggestAbstractModal } from "./web-components/modals/suggest-abstract-modal/suggest-abstract-modal.js";
import { suggestTitlesModal } from "./web-components/modals/suggest-titles-modal/suggest-titles-modal.js"
import { documentsPage } from "./web-components/pages/documents-page/documents-page.js";
import { documentViewPage } from "./web-components/pages/document-view-page/document-view-page.js";
import { editTitlePage } from "./web-components/pages/edit-title-page/edit-title-page.js";
import { chapterTitlePage } from "./web-components/pages/chapter-title-page/chapter-title-page.js";
import { chapterBrainstormingPage } from "./web-components/pages/chapter-brainstorming-page/chapter-brainstorming-page.js";
import { paragraphBrainstormingPage } from "./web-components/pages/paragraph-brainstorming-page/paragraph-brainstorming-page.js";
import { paragraphProofreadPage } from "./web-components/pages/paragraph-proofread-page/paragraph-proofread-page.js";
import { editAbstractPage } from "./web-components/pages/edit-abstract-page/edit-abstract-page.js";
import { proofReaderPage } from "./web-components/pages/proof-reader-page/proof-reader-page.js";
import { myOrganizationPage } from "./web-components/pages/my-organization-page/my-organization-page.js";
import { documentSettingsPage } from "./web-components/pages/document-settings-page/document-settings-page.js";
import { brainstormingPage } from "./web-components/pages/brainstorming-page/brainstorming-page.js";
import { llmsPage } from "./web-components/subpages/llms-page/llms-page.js";
import { personalitiesPage } from "./web-components/subpages/personalities-page/personalities-page.js";
import { announcementsPage } from "./web-components/subpages/announcements-page/announcements-page.js";
import { usersPage } from "./web-components/subpages/users-page/users-page.js";
import { closeModal, showActionBox, showModal } from "../WebSkel/utils/modal-utils.js";
import { notBasePage, getClosestParentElement } from "../WebSkel/utils/dom-utils.js";
import { storageService } from "./core/services/storageService.js";
import { Chapter } from "./core/models/chapter.js";
import { Document} from "./core/models/document.js";
import { Personality } from "./core/models/personality.js";
import { User } from "./core/models/user.js";
import { Announcement } from "./core/models/announcement.js";
import { Paragraph } from "./core/models/paragraph.js";
import { Company } from "./core/company.js";
import { companyDropdown }  from "./web-components/components/company-dropdown/company-dropdown.js";
import { chapterUnit } from "./web-components/components/item-list/chapter-unit/chapter-unit.js";
import { addRecord, getRecord, getAllRecords, getTableRecords, deleteRecord, openDatabase, updateRecord } from "./utils/indexDB.js";
import { initUser, registerAccountActions } from "./core/services/authenticationService.js";
import { documentService } from "./core/services/documentService.js";
import { llmsService } from "./core/services/llmsService.js";
import { personalitiesService } from "./core/services/personalitiesService.js";
import { usersService } from "./core/services/usersService.js";
import { spaceSettingsService } from "./core/services/spaceSettingsService.js";
import { brainstormingService }   from "./core/services/brainstormingService.js";
import { LLM } from "./core/models/llm.js";
import WebSkel from "../WebSkel/webSkel.js";
import {companyService} from "./core/services/companyService.js";
import { extractFormInformation } from "../WebSkel/utils/form-utils.js";
import { addCompanyModal} from "./web-components/modals/add-company-modal/add-company-modal.js";
import { Settings } from "./core/models/settings.js";
export {
    Settings,
    documentService,
    addCompanyModal,
    llmsService,
    personalitiesService,
    usersService,
    brainstormingService,
    spaceSettingsService,
    addDocumentModal,
    addAnnouncementModal,
    addChapterModal,
    addLLMModal,
    addPersonalityModal,
    addUserModal,
    suggestAbstractModal,
    suggestTitlesModal,
    documentsPage,
    documentViewPage,
    editTitlePage,
    companyDropdown,
    editAbstractPage,
    proofReaderPage,
    myOrganizationPage,
    documentSettingsPage,
    chapterTitlePage,
    chapterBrainstormingPage,
    paragraphProofreadPage,
    paragraphBrainstormingPage,
    chapterUnit,
    brainstormingPage,
    llmsPage,
    personalitiesPage,
    announcementsPage,
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
    Announcement,
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
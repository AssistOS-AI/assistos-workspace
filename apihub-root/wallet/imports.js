import { addDocumentModal } from "./web-components/modals/add-document-modal/add-document-modal.js";
import { addAnnouncementModal } from "./web-components/modals/add-announcement-modal/add-announcement-modal.js";
import { addChapterModal } from "./web-components/modals/add-chapter-modal/add-chapter-modal.js";
import { addLLMModal } from "./web-components/modals/add-llm-modal/add-llm-modal.js";
import { editLLMKeyModal } from "./web-components/modals/edit-llm-key-modal/edit-llm-key-modal.js";
import { addPersonalityModal } from "./web-components/modals/add-personality-modal/add-personality-modal.js";
import { addUserModal } from "./web-components/modals/add-user-modal/add-user-modal.js";
import { suggestAbstractModal } from "./web-components/modals/suggest-abstract-modal/suggest-abstract-modal.js";
import { suggestTitlesModal } from "./web-components/modals/suggest-titles-modal/suggest-titles-modal.js"
import { documentsPage } from "./web-components/pages/documents-page/documents-page.js";
import { documentViewPage } from "./web-components/pages/document-view-page/document-view-page.js";
import { editTitlePage } from "./web-components/pages/edit-title-page/edit-title-page.js";
import { chapterTitlePage } from "./web-components/pages/chapter-title-page/chapter-title-page.js";
import { manageParagraphsPage } from "./web-components/pages/manage-paragraphs-page/manage-paragraphs-page.js";
import { paragraphEditPage } from "./web-components/pages/paragraph-edit-page/paragraph-edit-page.js";
import { paragraphProofreadPage } from "./web-components/pages/paragraph-proofread-page/paragraph-proofread-page.js";
import { editAbstractPage } from "./web-components/pages/edit-abstract-page/edit-abstract-page.js";
import { proofReaderPage } from "./web-components/pages/proof-reader-page/proof-reader-page.js";
import { spacePage } from "./web-components/pages/space-page/space-page.js";
import { documentSettingsPage } from "./web-components/pages/document-settings-page/document-settings-page.js";
import { manageChaptersPage } from "./web-components/pages/manage-chapters-page/manage-chapters-page.js";
import { personalitiesPage } from "./web-components/subpages/personalities-page/personalities-page.js";
import { announcementsPage } from "./web-components/subpages/announcements-page/announcements-page.js";
import { closeModal, showActionBox, showModal } from "../WebSkel/utils/modal-utils.js";
import { notBasePage, getClosestParentElement } from "../WebSkel/utils/dom-utils.js";
import { Chapter } from "./core/models/chapter.js";
import { DocumentModel} from "./core/models/documentModel.js";
import { Personality } from "./core/models/personality.js";
import { User } from "./core/models/user.js";
import { Announcement } from "./core/models/announcement.js";
import { Paragraph } from "./core/models/paragraph.js";
import { Space } from "./core/models/space.js";
import { spaceDropdown }  from "./web-components/components/space-dropdown/space-dropdown.js";
import { chapterUnit } from "./web-components/components/item-list/chapter-unit/chapter-unit.js";
import { LLM } from "./core/models/llm.js";
import WebSkel from "../WebSkel/webSkel.js";
import { extractFormInformation } from "../WebSkel/utils/form-utils.js";
import { addSpaceModal} from "./web-components/modals/add-space-modal/add-space-modal.js";
import { Settings } from "./core/models/settings.js";
import {Script} from "./core/models/script.js";
export {
    Settings,
    addSpaceModal,
    addDocumentModal,
    addAnnouncementModal,
    addChapterModal,
    addLLMModal,
    editLLMKeyModal,
    addPersonalityModal,
    addUserModal,
    suggestAbstractModal,
    suggestTitlesModal,
    documentsPage,
    documentViewPage,
    editTitlePage,
    spaceDropdown,
    editAbstractPage,
    proofReaderPage,
    spacePage,
    documentSettingsPage,
    chapterTitlePage,
    manageParagraphsPage,
    paragraphProofreadPage,
    paragraphEditPage,
    chapterUnit,
    manageChaptersPage,
    personalitiesPage,
    announcementsPage,
    notBasePage,
    showModal,
    closeModal,
    showActionBox,
    getClosestParentElement,
    Space,
    WebSkel,
    Chapter,
    DocumentModel,
    Personality,
    User,
    Announcement,
    Paragraph,
    LLM,
    Script,
    extractFormInformation,
};
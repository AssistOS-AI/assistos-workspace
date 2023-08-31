import { Company } from "../../core/company.js";
import { closeModal } from "../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";
import { Document } from "../../core/models/document.js";

export class suggestAbstractModal {
    constructor() {
        let currentCompany = Company.getInstance();
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    async addDocumentSubmitForm(_target) {
        let documentTitle= new FormData(getClosestParentElement(_target,'form')).get("documentTitle");
        let documentObj= new Document(documentTitle);
        let documentId = await webSkel.localStorage.addDocument(documentObj);
        closeModal(_target);
        let currentCompany = Company.getInstance();
        documentObj.id = documentId;
        currentCompany.companyState.documents.push(documentObj);
        currentCompany.notifyObservers();
    }

    beforeRender() {

    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}
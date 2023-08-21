import { Company } from "../core/company.js";

export class myOrganisationPage {
    constructor() {
        // this.title = "My Organisation";
        // this.name = "Name";
        // this.status = "Status";
        this.modal = "showAddAnnounceModal";
        this.button = "Add announce";
        // this.tableRows = "No data loaded";
        let currentCompany= Company.getInstance();
        setTimeout(()=> {
            this._announceConfigs = currentCompany.companyState.announces;
            this.invalidate();
        },0);
        currentCompany.onChange((companyState) => {
            this._announceConfigs = companyState.announces;
            this.invalidate();
        });
    }

    beforeRender() {
        // this.tableRows="";
        // if(this._documentConfigs) {
        //     this._documentConfigs.forEach((item) => {
        //         this.tableRows += `<document-item-renderer data-name='${item.name}' data-status="${item.status}" data-primary-key=${item.primaryKey}"></document-item-renderer>`;
        //     });
        // } else {
        //     this.tableRows=`<div> No Data Currently </div>`;
        // }
    }
    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}
import { Company } from "../core/company.js";

export class newsletterPage {

    constructor() {
        this.title = "Newsletter";
        this.key = "KEY";
        this.name = "Name";
        this.description = "Description";
        this.subject = "Subject";
        this.status = "Status";
        this.button = "Register Newsletter";
        this.tableRows = "No data loaded";
        let currentCompany= Company.getInstance();
        setTimeout(()=>{
                this.newsletterConfigs = currentCompany.companyState.newsletters;
                this.invalidate();},
            0);
        currentCompany.onChange((companyState) => {
            this.newsletterConfigs= companyState.newsletters;
            this.invalidate();
        });
        document.addEventListener("click", (event) => {
            let showBox = document.querySelectorAll("div.action-box");
            showBox.forEach((actionWindow) => {
                if(actionWindow.style.display === "block")
                    actionWindow.style.display = "none";
            });
            console.log("Am apasat pe document.")
        }, true);

    }

    beforeRender() {
        this.tableRows="";
        if(this.newsletterConfigs) {
            this.newsletterConfigs.forEach((item) => {
                this.tableRows += `<llm-item-renderer data-name=${item.name} data-description=${item.description} data-subject=${item.subject} data-status=${item.status} data-primary-key=${item.primaryKey}"></llm-item-renderer>`;
            });
        }else{
            this.tableRows=`<div> No Data Currently </div>`;
        }
    }
    /* adding event Listeners after the web component has loaded, etc */
    afterRender(){

    }

    showAddLLMModal() {

    }
}

const onClickOutside = (e) => {
    if (!e.target.className.includes("action-box")) {
        e.target.style.display = "none";
    }
};

export function showActionBoxNewsletter(primaryKey) {
    console.log("Am apasat action box.")
    let showBox= document.getElementById(primaryKey);
    if(showBox.style.display==="none" || showBox.style.display==="") {
        showBox.style.display = "block";
    }
}
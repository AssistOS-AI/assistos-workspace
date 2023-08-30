export class CurrentCompany{
    constructor() {
        if (CurrentCompany.instance) {
            return CurrentCompany.instance;
        }
    }
    static getInstance() {
        if(!this.instance) {
            this.instance = new CurrentCompany();
        }
        return this.instance;
    }
    observe(){}
    isPremium(){}
    switchCompany(){}
    listAvailableCompanies(){}
}
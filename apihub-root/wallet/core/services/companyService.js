export class companyService{
    constructor(){

    }
    async addCompany(title){
        this.changeCompany(await webSkel.localStorage.addCompany({name:title,llms:[],documents:[],personalities:[],admins:[],settings:[],users:[]}));
    }
    changeCompany(companyId){
        window.currentCompanyId = companyId;
        let user = JSON.parse(localStorage.getItem("currentUser"));
        user.currentCompanyId = currentCompanyId;
        localStorage.setItem("currentUser", JSON.stringify(user));
        window.location = "";
    }
    getCompanyNames(){
        return currentUser.companies.filter(company => company.id !== currentCompanyId)||[];
    }
}
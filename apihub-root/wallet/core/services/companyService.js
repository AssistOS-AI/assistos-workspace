export class companyService{
    constructor(){

    }
    async addCompany(title){
        window.changeCompany(await webSkel.localStorage.addCompany({name:title,llms:[],documents:[],personalities:[],admins:[],settings:[],users:[]}));
    }
    deleteCompany(){}

}
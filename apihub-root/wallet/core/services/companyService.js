export class companyService {
    constructor() {

    }

    async addCompany(title){
        let currentDate = new Date();
        let today = currentDate.toISOString().split('T')[0];
        let textString = "Company " + title + " was successfully created. You can now add documents, users and settings to your company.";
        let newAnnouncements = [{
            id: 1,
            title: "Welcome to AIAuthor!",
            text: textString,
            date: today
        }];
        window.changeCompany(await webSkel.localStorage.addCompany({ name: title, llms: [], documents: [], personalities: [], admins: [], announcements: newAnnouncements, settings: [], users: []}));
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

    deleteCompany() {

    }
}
export class UserService{
    constructor() {

    }
    getCachedUser(){
        return localStorage.getItem("currentUser");
    }
    async createUser(userData){
        await AssistOS.RequestsFacade.createUser(userData);
    }
    authenticateUser(){

    }
}
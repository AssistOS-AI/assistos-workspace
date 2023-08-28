import {liteUserDatabase} from "../imports.js";

export class Company {
    constructor(userType) {
        this.load(userType);
        this.observers=[];
    }

    async load(userType) {
        if(userType!=="lite") {
            let response = await fetch('/wallet/data.json');
            this.companyState = await response.json();
        }else{
            /* We could load only the data we need for the current page instead? */
            this.companyState=await this.loadDatabaseData();
        }
        this.notifyObservers();
    }

    async loadDatabaseData(){
            await webSkel.liteUserDB.init();
            const liteUserData=await webSkel.liteUserDB.getAllRecords();
            return liteUserData;
    }
    static getInstance(userType="lite") {
        if(!this.instance) {
            this.instance = new Company(userType);
        }
        return this.instance;
    }

    onChange(observerFunction) {
        this.observers.push(new WeakRef(observerFunction));
    }

    notifyObservers() {
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if (observer) {
                observer(this.companyState);
            }
        }
    }
}
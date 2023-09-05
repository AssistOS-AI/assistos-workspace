import { Registry}  from "../imports.js";

export class Company {
    /* pass storage data as constructor parameter */
    /* both the user and company know of each other */
    /* the user has a list of company, and the company has a list of users */
    constructor(storageService) {
        /* Prevent creating a new Instance with the new keyword */
        if (Company.instance) {
            return Company.instance;
        }
        this.companyState = storageService ? storageService : [];
        this.observers = [];
    }

/*
    async load(userType) {
        /!* refactor into something more abstract, no string checks etc *!/
        if(userType !== "lite") {
            let response = await fetch('/wallet/data.json');
            this.companyState = await response.json();
        } else {
            /!* We could load only the data we need for the current page instead? *!/
            this.companyState = await this.loadDatabaseData();
        }
        this.documentsRegistry = Registry.getInstance(this.companyState.documents);
        this.notifyObservers();
    }
*/

/*    async loadDatabaseData(){
        await webSkel.storageService.initDatabase();
        return await webSkel.storageService.getAllData();
    }*/

    static getInstance(storageData) {
        if(!this.instance) {
            this.instance = new Company(storageData);
        }
        return this.instance;
    }

    onChange(observerFunction) {
        this.observers.push(new WeakRef(observerFunction));
    }

    //WeakSet instead of array of WeakRefs
    notifyObservers() {
          for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if (observer) {
                observer(this.companyState);
            }
        }
        /* Quick Fix - To be removed */
        /*this.observers[this.observers.length-1].deref()(this.companyState);*/
    }
}
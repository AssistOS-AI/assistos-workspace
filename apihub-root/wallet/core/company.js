export class Company {
    constructor() {
        this.load();
        this.observers=[];
    }

    async load() {
        let response = await fetch('./data.json');
        this.companyState = await response.json();
        this.notifyObservers();
    }

    static getInstance() {
        if(!this.instance) {
            this.instance = new Company();
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
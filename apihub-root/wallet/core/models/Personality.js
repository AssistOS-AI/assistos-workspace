export class Personality {
    constructor(personalityData) {
        this.name = personalityData.name;
        this.description = personalityData.description;
        this.id = personalityData.id || system.services.generateId();
        this.image = personalityData.image;
    }
    update(personalityData){
        this.name = personalityData.name;
        this.description = personalityData.description;
        if(personalityData.image){
            this.image = personalityData.image;
        }
    }

    simplify(){
        return {
            name: this.name,
            id: this.id
        }
    }
    getFileName(){
        return this.name.split(" ").join("_").toLowerCase() + "-" + this.id;
    }
}
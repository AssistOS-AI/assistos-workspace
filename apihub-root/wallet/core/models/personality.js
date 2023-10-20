export class Personality {
    constructor(personalityData) {
        this.name = personalityData.name;
        this.description = personalityData.description;
        this.id = personalityData.id;
        this.image = personalityData.image;
    }
    update(personalityData){
        this.name = personalityData.name;
        this.description = personalityData.description;
        if(personalityData.image){
            this.image = personalityData.image;
        }
    }
}
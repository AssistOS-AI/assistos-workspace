
export class personalitiesService{
    constructor(){}
    getPersonalities() {
        return company.personalities || [];
    }
    async addPersonality(personality) {
        await webSkel.localStorage.addPersonality(personality);
        company.personalities.push(personality);
    }
}
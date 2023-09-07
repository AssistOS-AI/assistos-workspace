
export class personalitiesService{
    constructor(){}
    getPersonalities() {
        return webSkel.company.personalities || [];
    }
    async addPersonality(personality) {
        await webSkel.localStorage.addPersonality(personality);
        webSkel.company.personalities.push(personality);
    }
}
export async function createSpace(spaceName, apiKey) {
    return await AssistOS.SpaceFactory.createSpace(spaceName, apiKey);
}
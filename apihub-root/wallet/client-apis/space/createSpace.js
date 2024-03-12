export async function createSpace(userId, spaceName, apiKey) {
    return await AssistOS.SpaceFactory.createSpace(userId, spaceName, apiKey);
}
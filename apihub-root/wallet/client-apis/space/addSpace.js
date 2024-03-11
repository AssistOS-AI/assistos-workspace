export async function addSpace(spaceDataObject) {
    const spaceInstance = new AssistOS.Models.Space(spaceDataObject);
    await AssistOS.storageManager.addSpace(spaceInstance);
    return spaceInstance
}
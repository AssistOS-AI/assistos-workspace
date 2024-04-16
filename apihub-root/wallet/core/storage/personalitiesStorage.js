async function loadDefaultPersonalities() {
    const result = await fetch(`/personalities/default`,
        {
            method: "GET"
        });
    return await result.text();
}
async function loadFilteredKnowledge(words, personalityId) {
    const result = await fetch(`/personalities/${assistOS.space.id}/${personalityId}/search?param1=${words}`,
        {
            method: "GET"
        });
    return await result.text();
}
export default {loadDefaultPersonalities, loadFilteredKnowledge};
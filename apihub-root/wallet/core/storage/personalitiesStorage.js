async function loadDefaultPersonalities() {
    const result = await fetch(`/personalities/default`,
        {
            method: "GET"
        });
    return await result.text();
}
async function loadFilteredKnowledge(words, agentId) {
    const result = await fetch(`/agents/${system.space.id}/${agentId}/search?param1=${words}`,
        {
            method: "GET"
        });
    return await result.text();
}
export default {loadDefaultPersonalities, loadFilteredKnowledge};
const API_BASE = 'http://localhost:3001';
const USER_ID = 'reader-' + Math.random().toString(36).substr(2, 9);

async function bridgeChoice(chapterId, choiceIndex) {
    const response = await fetch(`${API_BASE}/choice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, chapterId, choiceIndex })
    });
    return await response.json();
}

async function fetchChapter(id) {
    const response = await fetch(`${API_BASE}/chapter/${id}`);
    return await response.json();
}

window.CognoscentBridge = {
    bridgeChoice,
    fetchChapter,
    userId: USER_ID
};

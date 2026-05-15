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

// Simple state manager for the frontend
let state = {
    currentChapterId: 1,
    progress: {}
};

async function loadChapter(id) {
    state.currentChapterId = id;
    const chapter = await fetchChapter(id);
    
    const storyText = document.getElementById('story-text');
    const choicesContainer = document.getElementById('choices-container');
    const interactiveZone = document.getElementById('interactive-zone');

    if (!chapter) return;

    storyText.innerText = chapter.text;
    choicesContainer.innerHTML = '';
    interactiveZone.innerHTML = '';

    if (chapter.interactiveElement) {
        renderInteractiveElement(chapter.interactiveElement);
    }

    chapter.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.innerText = choice.text;
        btn.onclick = async () => {
            await bridgeChoice(id, index);
            loadChapter(choice.nextChapter);
        };
        choicesContainer.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadChapter(1);
});

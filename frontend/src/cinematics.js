async function applyCinematicEffects(chapterId) {
    const overlay = document.querySelector('.dark-node-overlay');
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'dark-node-overlay';
        document.body.appendChild(newOverlay);
    }

    // Trigger glitch on "Dark Nodes" (e.g., Chapter 8 Helsinki, Chapter 12 Mirror)
    const darkNodes = [8, 12, 36];
    if (darkNodes.includes(chapterId)) {
        document.querySelector('.dark-node-overlay').style.opacity = '0.4';
        window.Sfx.triggerGlitch();
        window.Sfx.updateTension(2);
        
        const text = document.getElementById('story-text');
        text.classList.add('glitch-text');
        text.setAttribute('data-text', text.innerText);
    } else {
        document.querySelector('.dark-node-overlay').style.opacity = '0';
        text.classList.remove('glitch-text');
        window.Sfx.updateTension(0);
    }
}

// Update loadChapter in main.js to include effects
const originalLoadChapter = window.loadChapter; 
window.loadChapter = async function(id) {
    await originalLoadChapter(id);
    applyCinematicEffects(id);
};

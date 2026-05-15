const narrativeData = require('./narrativeData');

function simulateNarrative() {
    const visited = new Set();
    const queue = [1]; // Start at Chapter 1
    const deadEnds = [];

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const chapter = narrativeData.chapters[currentId];
        if (!chapter) continue;

        if (chapter.choices.length === 0) {
            deadEnds.push(currentId);
        } else {
            chapter.choices.forEach(c => queue.push(c.nextChapter));
        }
    }

    console.log('--- Narrative Audit ---');
    console.log(`Visited Chapters: ${visited.size}/${Object.keys(narrativeData.chapters).length}`);
    console.log(`Terminating Nodes (Endings): ${deadEnds.length}`);
    console.log(`End Nodes: ${deadEnds.join(', ')}`);
    
    const unvisited = Object.keys(narrativeData.chapters).filter(id => !visited.has(parseInt(id)));
    if (unvisited.length > 0) {
        console.log(`Unreachable Chapters: ${unvisited.join(', ')}`);
    } else {
        console.log('All chapters are reachable.');
    }
}

simulateNarrative();

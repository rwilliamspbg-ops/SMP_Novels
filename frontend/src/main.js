const API_BASE = '/api';
const USER_ID = 'reader-' + Math.random().toString(36).substr(2, 9);
let metricsSocket;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, options = {}, attempts = 3) {
    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                await sleep(250 * attempt);
            }
        }
    }

    throw lastError;
}

async function bridgeChoice(chapterId, choiceIndex) {
    return await fetchJsonWithRetry(`${API_BASE}/choice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, chapterId, choiceIndex })
    });
}

async function fetchChapter(id) {
    return await fetchJsonWithRetry(`${API_BASE}/chapter/${id}`);
}

function getMetricsSocketUrl() {
    const url = new URL(window.location.href);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.port = '3001';
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.toString();
}

function updateMetrics(metrics) {
    const throughput = document.getElementById('metric-throughput');
    const latency = document.getElementById('metric-latency');
    const resilience = document.getElementById('metric-resilience');
    const energy = document.getElementById('metric-energy');

    if (throughput) throughput.innerText = Number(metrics.throughput).toFixed(1);
    if (latency) latency.innerText = Number(metrics.latency).toFixed(1);
    if (resilience) resilience.innerText = Number(metrics.resilience).toFixed(1);
    if (energy) energy.innerText = Number(metrics.energy).toFixed(1);
}

function connectMetricsStream() {
    const socketUrl = getMetricsSocketUrl();

    try {
        metricsSocket = new WebSocket(socketUrl);
    } catch (error) {
        console.error('Failed to open metrics socket:', error);
        return;
    }

    metricsSocket.addEventListener('message', (event) => {
        try {
            const metrics = JSON.parse(event.data);
            updateMetrics(metrics);
        } catch (error) {
            console.error('Failed to parse metrics payload:', error);
        }
    });

    metricsSocket.addEventListener('error', (error) => {
        console.error('Metrics socket error:', error);
    });

    metricsSocket.addEventListener('close', () => {
        window.setTimeout(connectMetricsStream, 2000);
    });
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
    let chapter;
    try {
        chapter = await fetchChapter(id);
    } catch (error) {
        console.error('Failed to load chapter:', error);
        const storyText = document.getElementById('story-text');
        if (storyText) {
            storyText.innerText = 'Unable to reach the backend on port 3001. Check that the API container is running and reachable from this browser session.';
        }
        return;
    }
    
    const storyText = document.getElementById('story-text');
    const choicesContainer = document.getElementById('choices-container');
    const interactiveZone = document.getElementById('interactive-zone');

    if (!chapter || chapter.error) {
        storyText.innerText = 'Chapter data is unavailable right now.';
        return;
    }

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
    connectMetricsStream();
    loadChapter(1);
});

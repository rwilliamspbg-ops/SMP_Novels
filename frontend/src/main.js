const API_BASE = 'http://localhost:3001';
const WS_BASE = 'ws://localhost:3001';

let authToken = localStorage.getItem('token');
let currentChapterId = 1;
let editorInstance = null;

const elements = {
    authContainer: document.getElementById('auth-container'),
    storyContainer: document.getElementById('story-container'),
    storyText: document.getElementById('story-text'),
    choicesContainer: document.getElementById('choices-container'),
    interactiveZone: document.getElementById('interactive-zone'),
    throughput: document.getElementById('metric-throughput'),
    latency: document.getElementById('metric-latency'),
    resilience: document.getElementById('metric-resilience'),
    energy: document.getElementById('metric-energy'),
    adminPanel: document.getElementById('admin-panel'),
    adminToggle: document.getElementById('admin-toggle'),
};

async function requestWithAuth(path, body = null) {
    const options = { headers: { 'Content-Type': 'application/json' } };
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
    if (body) options.method = 'POST', options.body = JSON.stringify(body);
    try {
        const response = await fetch(`${API_BASE}${path}`, options);
        const payload = await response.json();

        if (response.status === 401) {
            showAuth();
            return { error: 'Unauthorized', status: 401 };
        }

        return payload;
    } catch (e) {
        console.error('API Error:', e);
        return { error: 'Backend unreachable' };
    }
}

function showAuth() {
    elements.authContainer.style.display = 'block';
    elements.storyContainer.style.display = 'none';
    elements.adminPanel.style.display = 'none';
}

function hideAuth() {
    elements.authContainer.style.display = 'none';
    elements.storyContainer.style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
        const result = await requestWithAuth('/auth/login', data);
        if (result.token) {
            authToken = result.token;
            localStorage.setItem('token', authToken);
            hideAuth();
            loadChapter(1);
        } else {
            alert('Login failed: ' + (result.error || 'Unknown error'));
        }
    } catch (e) { alert('Connection error'); }
}

async function loadChapter(id) {
    currentChapterId = id;
    const chapter = await requestWithAuth(`/novel/cognoscent-echo/chapter/${id}`);
    if (!chapter || chapter.error) {
        if (chapter && chapter.status === 401) return;
        elements.storyText.innerText = "Error loading chapter. Ensure backend is running.";
        return;
    }
    elements.storyText.innerText = chapter.text;
    elements.choicesContainer.innerHTML = '';
    elements.interactiveZone.innerHTML = '';

    if (chapter.interactiveElement) renderInteractiveElement(chapter.interactiveElement);

    chapter.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice.text;
        btn.onclick = () => loadChapter(choice.nextChapter);
        elements.choicesContainer.appendChild(btn);
    });
}

function renderInteractiveElement(element) {
    if (element.type === 'code_snippet') {
        const div = document.createElement('div');
        div.className = 'code-playground';
        div.innerHTML = `
            <h3 style='color:#00ffcc'>${element.description}</h3>
            <div id='monaco-container' class='monaco-editor-container'></div>
            <button class='run-btn'>Execute WASM Logic</button>
            <div id='code-output'></div>
        `;
        
        elements.interactiveZone.appendChild(div);

        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function() {
            editorInstance = monaco.editor.create(document.getElementById('monaco-container'), {
                value: element.initialCode,
                language: 'go',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false }
            });
        });

        div.querySelector('.run-btn').onclick = async () => {
            const code = editorInstance.getValue();
            const outputDiv = div.querySelector('#code-output');
            outputDiv.innerHTML = 'Compiling to WASM...';
            
            const isValid = simulateWasmExecution(code);
            
            setTimeout(async () => {
                if (isValid) {
                    outputDiv.innerHTML = `<div class='output'>[WASM SUCCESS] Binary checksum valid. Memory leak plugged.</div>`;
                    await requestWithAuth('/save', { novelId: 'cognoscent-echo', update: { metrics: { throughput: 150 } } });
                    await requestWithAuth('/ai-response', { character: 'elias', context: 'success' });
                } else {
                    outputDiv.innerHTML = `<div class='output' style='color:red'>[WASM ERROR] Runtime panic: invalid memory address or nil pointer dereference.</div>`;
                    await requestWithAuth('/ai-response', { character: 'elias', context: 'failure' });
                }
            }, 1000);
        };
    }
}

function simulateWasmExecution(code) {
    return code.includes('sync.Pool') && code.includes('make([]byte');
}

elements.adminToggle.onclick = () => {
    elements.adminPanel.style.display = elements.adminPanel.style.display === 'none' ? 'block' : 'none';
};

document.getElementById('save-node').onclick = async () => {
    const text = document.getElementById('node-text').value;
    const ai = document.getElementById('node-ai').value;
    const update = {
        text: text,
        choices: [{ text: "Proceed", nextChapter: 2 }],
        interactiveElement: { type: "text", content: ai }
    };
    const res = await requestWithAuth('/admin/novel/update', { 
        slug: 'cognoscent-echo', 
        chapterId: 1, 
        update 
    });
    alert('Chapter deployed to production!');
};

document.getElementById('login-form').onsubmit = handleLogin;

if (authToken) {
    hideAuth();
    loadChapter(1);
} else {
    showAuth();
}

// RESILIENT WEBSOCKET CONNECTION
function connectDashboard() {
    console.log('Attempting to connect to Protocol HUD...');
    const ws = new WebSocket(WS_BASE);
    
    ws.onopen = () => {
        console.log('HUD Connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        elements.throughput.innerText = data.throughput.toFixed(2) + ' pkts/s';
        elements.latency.innerText = data.latency.toFixed(2) + ' us';
        elements.resilience.innerText = data.resilience.toFixed(2) + '%';
        elements.energy.innerText = data.energy.toFixed(2) + ' kWh';
    };

    ws.onclose = () => {
        console.log('HUD Disconnected. Retrying in 3 seconds...');
        setTimeout(connectDashboard, 3000);
    };

    ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
    };
}

connectDashboard();

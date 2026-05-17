/**
 * Cognoscent Echo - A2UI + CopilotKit + AG-UI Powered Interface
 * Enhanced with MCP Apps, Live Metrics, and AI Copilot Integration
 */

// ===========================================
// CONFIGURATION
// ===========================================
const API_BASE = '/api';
const USER_ID_KEY = 'userId';
let userId = localStorage.getItem(USER_ID_KEY) || null;
let metricsSocket = null;
let copilotConnected = false;

// ===========================================
// AG-UI COMPONENT REGISTRATION
// ===========================================
AG.registerComponent('NovelChapter', {
    template: '<div class="chapter-card">{{text}}</div>',
    props: ['text'],
    bindings: {
        nextChoice: 'choiceIndex'
    }
});

AG.registerComponent('WASMSandbox', {
    template: '<div class="sandbox-container"><editor :code="code" /></div>',
    props: ['code']
});

// ===========================================
// A2UI BINDABLE STATE MANAGEMENT
// ===========================================
const state = {
    // Metrics state (bound to A2UI)
    metrics: {
        throughput: 100,
        latency: 50,
        resilience: 80,
        energy: 200
    },
    
    // Auth state
    auth: {
        username: '',
        password: ''
    },
    
    // Sandbox state
    sandbox: {
        code: '// Write your Go code here...',
        metrics: null
    },
    
    // Governance state
    governance: {
        proposal: null,
        votes: {}
    },
    
    // Copilot state
    copilot: {
        query: '',
        messages: []
    }
};

// Make state accessible to A2UI framework
window.CognoscentState = state;
A2UI.registerBindable('cognoscent-state', () => state);

// ===========================================
// METRICS WebSocket CONNECTION
// ===========================================
function getMetricsSocketUrl() {
    const url = new URL(window.location.href);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.port = '3001';
    url.pathname = '/';
    return url.toString();
}

function connectMetricsStream() {
    try {
        metricsSocket = new WebSocket(getMetricsSocketUrl());
        
        metricsSocket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                updateMetrics(data);
                
                // Update A2UI bound state
                if (A2UI.isRegistered()) {
                    A2UI.updateBound('metrics.throughput', data.throughput);
                    A2UI.updateBound('metrics.latency', data.latency);
                    A2UI.updateBound('metrics.resilience', data.resilience);
                    A2UI.updateBound('metrics.energy', data.energy);
                }
            } catch (e) {
                console.error('Metrics parse error:', e);
            }
        });
        
        metricsSocket.addEventListener('open', () => {
            console.log('✅ Metrics WebSocket connected');
        });
        
    } catch (error) {
        console.error('Failed to connect metrics socket:', error);
    }
}

function updateMetrics(data) {
    document.getElementById('metric-throughput')?.textContent = Number(data.throughput).toFixed(1);
    document.getElementById('metric-latency')?.textContent = Number(data.latency).toFixed(1);
    document.getElementById('metric-resilience')?.textContent = Number(data.resilience).toFixed(1);
    document.getElementById('metric-energy')?.textContent = Number(data.energy).toFixed(1);
}

// ===========================================
// COPILOT KIT INTEGRATION
// ===========================================
async function initCopilotKit() {
    try {
        const CopilotKit = await import('@copilotkit/react-core');
        
        // Configure CopilotKit agent
        await CopilotKit.init({
            appId: 'cognoscent-echo',
            serverUrl: '/api/copilot',
            debug: true
        });

        copilotConnected = true;
        console.log('✅ CopilotKit initialized');
        
        return true;
    } catch (error) {
        console.warn('CopilotKit not available:', error);
        return false;
    }
}

// ===========================================
// API ENDPOINTS
// ===========================================
async function bridgeChoice(chapterId, choiceIndex) {
    if (!userId) throw new Error('User not authenticated');
    
    const response = await fetch(`${API_BASE}/choice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId, 
            chapterId, 
            choiceIndex 
        })
    });
    
    if (!response.ok) throw new Error('Choice failed');
    return response.json();
}

async function fetchChapter(id) {
    try {
        const response = await fetch(`${API_BASE}/chapter/${id}`);
        return response.ok ? await response.json() : null;
    } catch (error) {
        console.error('Failed to load chapter:', error);
        return null;
    }
}

async function getProgress(userId) {
    if (!userId) return null;
    
    const response = await fetch(`${API_BASE}/progress/${userId}`);
    return response.ok ? await response.json() : null;
}

// ===========================================
// AUTHENTICATION HANDLER
// ===========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');
        
        try {
            // Set user ID and store credentials
            userId = `user-${Date.now()}`;
            localStorage.setItem(USER_ID_KEY, userId);
            
            // Generate simple session token (in production use proper auth)
            const token = btoa(`${username}:${password}-${Date.now()}`);
            sessionStorage.setItem('auth-token', token);
            
            // Update state for A2UI
            if (A2UI.isRegistered()) {
                A2UI.updateBound('auth.username', '');
                A2UI.updateBound('auth.password', '');
            }
            
            // Hide auth screen and load chapter
            document.getElementById('auth-container')?.classList.add('hidden');
            
            // Load initial chapter
            await loadChapter(1);
            
            console.log(`✅ User authenticated: ${userId}`);
            
        } catch (error) {
            console.error('Authentication failed:', error);
            alert('Authentication failed. Please try again.');
        }
    });
}

// ===========================================
// MAIN LOADING FUNCTION
// ===========================================
async function loadChapter(id, showFeedback = true) {
    let chapter;
    
    try {
        chapter = await fetchChapter(id);
    } catch (error) {
        console.error('Failed to load chapter:', error);
        
        const storyText = document.getElementById('story-text');
        if (storyText) {
            storyText.innerHTML = 'Unable to reach the backend. Make sure Docker is running.';
        }
        return false;
    }
    
    if (!chapter || chapter.error) {
        if (showFeedback && document.getElementById('story-text')) {
            document.getElementById('story-text').innerHTML = 
                'Chapter data unavailable.';
        }
        return false;
    }
    
    // Update UI
    const storyText = document.getElementById('story-text');
    const choicesContainer = document.getElementById('choices-container');
    const interactiveZone = document.getElementById('interactive-zone');
    const governanceZone = document.getElementById('governance-zone');
    const chapterHeader = document.getElementById('chapter-header');
    
    // Render chapter text with typing effect
    if (storyText) {
        showTypingEffect(storyText, chapter.text);
    }
    
    // Clear previous elements
    if (choicesContainer) choicesContainer.innerHTML = '';
    if (interactiveZone) interactiveZone.classList.add('hidden');
    if (governanceZone) governanceZone.classList.add('hidden');
    
    // Check for learning outcomes
    if (chapter.learningOutcomes && chapter.learningOutcomes.length > 0) {
        const outcomesPanel = document.getElementById('learning-outcomes-panel');
        if (outcomesPanel) {
            outcomesPanel.classList.remove('hidden');
            const list = document.getElementById('outcomes-list');
            if (list) {
                list.innerHTML = chapter.learningOutcomes.map(outcome => 
                    `<div class="outcome-item">💡 ${outcome}</div>`
                ).join('');
            }
        }
    }
    
    // Render interactive elements
    if (chapter.interactiveElement) {
        const elem = chapter.interactiveElement;
        
        // WASM Exercise
        if (elem.type === 'wasm_exercise') {
            interactiveZone.classList.remove('hidden');
            
            if (elem.starterCode) {
                document.getElementById('code-editor').value = elem.starterCode;
                
                // Bind to A2UI state
                if (A2UI.isRegistered()) {
                    A2UI.updateBound('sandbox.code', elem.starterCode);
                }
            }
            
            // Set exercise feedback
            if (elem.feedback) {
                const feedback = document.getElementById('wasm-feedback-panel');
                if (feedback) {
                    feedback.innerHTML = `
                        <h5>${elem.description}</h5>
                        <p class="learning-goal">${elem.learningGoal}</p>
                    `;
                    feedback.classList.remove('hidden');
                }
            }
        }
        
        // Governance Vote
        if (elem.type === 'governance_vote') {
            governanceZone.classList.remove('hidden');
            
            const proposalText = document.getElementById('proposal-text');
            if (proposalText) {
                proposalText.textContent = elem.description;
            }
            
            const optionsContainer = document.getElementById('voting-options');
            if (optionsContainer && elem.options && elem.options.length > 0) {
                optionsContainer.innerHTML = elem.options.map((option, index) => `
                    <div class="option-card" 
                         data-option-id="${option.id}"
                         onclick="handleVote('${option.id}', '${option.text}')">
                        ${option.text}
                        <small style="display:block; color:var(--text-muted); margin-top:5px;">
                            Impact: ${option.impact || 'See discussion'}
                        </small>
                    </div>
                `).join('');
            }
        }
    }
    
    // Render choices
    if (chapter.choices && chapter.choices.length > 0) {
        const nextChapterId = chapter.choices[0].nextChapter;
        
        chapter.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.onclick = async () => {
                await bridgeChoice(id, index);
                await loadChapter(nextChapterId);
                
                // Send to Copilot if connected
                if (copilotConnected) {
                    window.CopilotKit?.sendEvent({
                        type: 'chapter-transition',
                        payload: { 
                            from: id, 
                            to: nextChapterId, 
                            choice: choice.text 
                        }
                    });
                }
            };
            
            choicesContainer.appendChild(btn);
        });
    }
    
    return true;
}

// ===========================================
// TYPING EFFECT FOR STORY TEXT
// ===========================================
function showTypingEffect(element, text) {
    element.innerHTML = '';
    let index = 0;
    
    const typeInterval = setInterval(() => {
        element.textContent += text.charAt(index);
        index++;
        
        if (index >= text.length) {
            clearInterval(typeInterval);
            
            // Add blinking cursor when done
            setTimeout(() => {
                if (element.lastChild) {
                    element.lastChild.textContent = `${element.lastChild.textContent}|`;
                }
            }, 500);
        }
    }, 30); // Type speed in ms
}

// ===========================================
// WASM SANDBOX HANDLERS
// ===========================================
document.getElementById('run-code-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('code-editor').value;
    
    try {
        const response = await fetch(`${API_BASE}/sandbox/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code, 
                memoryInput: {},
                userId 
            })
        });
        
        if (!response.ok) throw new Error('Execution failed');
        
        const result = await response.json();
        console.log('Code execution result:', result);
        
        // Update A2UI bound metrics
        if (A2UI.isRegistered() && state.sandbox.metrics) {
            state.sandbox.metrics.throughput = result.executionTime;
            A2UI.updateBound('sandbox.metrics', state.sandbox.metrics);
        }
        
    } catch (error) {
        console.error('Sandbox execution error:', error);
    }
});

document.getElementById('inspect-memory-btn')?.addEventListener('click', async () => {
    // Simulate memory inspection
    const output = document.getElementById('interactive-zone');
    if (output) {
        output.innerHTML += '<div style="margin-top:10px;color:#10b981;">✅ Memory inspection complete</div>';
        
        // Send to Copilot for analysis
        if (copilotConnected) {
            window.CopilotKit?.sendEvent({
                type: 'memory-inspected',
                payload: { timestamp: Date.now() }
            });
        }
    }
});

document.getElementById('reset-code-btn')?.addEventListener('click', () => {
    if (A2UI.isRegistered()) {
        A2UI.updateBound('sandbox.code', '// Write your Go code here...');
    }
    
    document.getElementById('code-editor').value = '';
});

// ===========================================
// GOVERNANCE VOTE HANDLER
// ===========================================
async function handleVote(optionId, optionText) {
    try {
        const response = await fetch(`${API_BASE}/governance/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                proposalId: 'G-2029-047',
                optionId,
                userId
            })
        });
        
        if (response.ok) {
            // Update UI feedback
            document.getElementById('wasm-feedback-panel')?.innerHTML = `
                <h5>✅ Vote Recorded</h5>
                <p>You've chosen: ${optionText}</p>
            `;
            
            // Send to Copilot
            if (copilotConnected) {
                window.CopilotKit?.sendEvent({
                    type: 'vote-recorded',
                    payload: { optionId, optionText }
                });
            }
        } else {
            throw new Error('Vote failed');
        }
    } catch (error) {
        console.error('Vote error:', error);
    }
}

// ===========================================
// COPILOT CHAT HANDLERS
// ===========================================
const sendMessageBtn = document.getElementById('send-message-btn');
const copilotInput = document.getElementById('copilot-input');

if (sendMessageBtn && copilotInput) {
    sendMessageBtn.addEventListener('click', handleCopilotMessage);
    
    copilotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCopilotMessage();
        }
    });
}

async function handleCopilotMessage() {
    const query = copilotInput.value.trim();
    if (!query || !copilotConnected) return;
    
    // Add user message
    const messages = document.getElementById('chat-messages');
    if (messages) {
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.textContent = query;
        messages.appendChild(userMsg);
        
        // Clear input and scroll to bottom
        copilotInput.value = '';
        messages.scrollTop = messages.scrollHeight;
    }
    
    // Get AI response (simplified - in production use real Copilot API)
    try {
        const response = await fetch('/api/copilot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, userId })
        });
        
        const data = await response.json();
        
        // Add AI response
        if (messages) {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message assistant';
            aiMsg.innerHTML = formatCopilotResponse(data.response);
            messages.appendChild(aiMsg);
            
            messages.scrollTop = messages.scrollHeight;
        }
        
    } catch (error) {
        console.error('Copilot chat error:', error);
    }
    
    // Update A2UI bound state
    if (A2UI.isRegistered()) {
        A2UI.updateBound('copilot.query', '');
    }
}

function formatCopilotResponse(text) {
    // Simple formatting for Copilot responses
    return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*/g, '<strong>$1</strong>');
}

// ===========================================
// ADMIN TOGGLE (Show/Hide SaaS Admin Panel)
// ===========================================
document.getElementById('admin-toggle')?.addEventListener('click', () => {
    const panel = document.getElementById('admin-panel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
});

// ===========================================
// SIDEBAR TOGGLE
// ===========================================
const copilotTrigger = document.querySelector('.copilot-trigger');
const sidebar = document.getElementById('copilot-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

if (copilotTrigger) {
    copilotTrigger.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        
        if (!sidebar.classList.contains('hidden')) {
            // Focus chat input when sidebar opens
            setTimeout(() => copilotInput?.focus(), 100);
        }
    });
}

if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('hidden');
    });
}

// ===========================================
// INITIALIZATION
// ===========================================
async function init() {
    // Connect metrics stream immediately
    connectMetricsStream();
    
    // Wait for CopilotKit to initialize
    await initCopilotKit();
    
    // Load first chapter (only after auth if needed)
    const authContainer = document.getElementById('auth-container');
    if (!authContainer || !authContainer.classList.contains('hidden')) {
        return; // Still waiting for auth
    }
    
    // Load initial chapter
    await loadChapter(1);
    
    // Initialize A2UI bindings
    if (A2UI.isRegistered()) {
        console.log('✅ A2UI bindings initialized');
    }
    
    console.log('🚀 Cognoscent Echo v2.0 initialized with A2UI + CopilotKit + AG-UI');
}

// Start on page load
document.addEventListener('DOMContentLoaded', init);

// ===========================================
// EXPORT FOR GLOBAL ACCESS
// ===========================================
window.CognoscentBridge = {
    bridgeChoice,
    fetchChapter,
    userId: userId || 'anonymous'
};

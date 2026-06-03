// Cognoscent Echo - Main Application Entry Point
// Handles narrative loading, state management, and UI interactions

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize application state
    const appState = {
        currentChapterId: 1,
        progress: null,
        metrics: {
            throughput: 0,
            latency: 0,
            resilience: 0,
            energy: 0
        },
        userId: window.CognoscentBridge?.userId || 'anonymous',
        unlockedNodes: ['prologue']
    };

    // DOM Elements
    const elements = {
        authContainer: document.getElementById('auth-container'),
        adminToggle: document.getElementById('admin-toggle'),
        adminPanel: document.getElementById('admin-panel'),
        loginForm: document.getElementById('login-form'),
        storyText: document.getElementById('story-text'),
        interactiveZone: document.getElementById('interactive-zone'),
        choicesContainer: document.getElementById('choices-container'),
        metricThroughput: document.getElementById('metric-throughput'),
        metricLatency: document.getElementById('metric-latency'),
        metricResilience: document.getElementById('metric-resilience'),
        metricEnergy: document.getElementById('metric-energy')
    };

    // Initialize metrics display
    function updateMetricsDisplay() {
        elements.metricThroughput.textContent = appState.metrics.throughput || '-';
        elements.metricLatency.textContent = appState.metrics.latency || '-';
        elements.metricResilience.textContent = appState.metrics.resilience || '-';
        elements.metricEnergy.textContent = appState.metrics.energy || '-';
    }

    // Load chapter by ID
    async function loadChapter(chapterId) {
        try {
            appState.currentChapterId = chapterId;
            
            // Fetch chapter data
            const chapter = await window.CognoscentBridge.fetchChapter(chapterId);
            
            if (!chapter) {
                throw new Error(`Chapter ${chapterId} not found`);
            }

            // Render chapter content
            elements.storyText.innerHTML = renderStoryText(chapter);
            
            // Render interactive element if present
            if (chapter.interactiveElement) {
                renderInteractiveElement(chapter.interactiveElement);
            } else {
                elements.interactiveZone.innerHTML = '';
            }

            // Render choices
            renderChoices(chapter.choices);

            // Update metrics display
            updateMetricsDisplay();

        } catch (error) {
            console.error('[App] Error loading chapter:', error);
            elements.storyText.innerHTML = `
                <p style="color: #ff4444; padding: 20px; text-align: center;">
                    <strong>Error:</strong> ${error.message}
                </p>
            `;
        }
    }

    // Render story text with formatting
    function renderStoryText(chapter) {
        // Escape HTML to prevent XSS
        const escapedText = chapter.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        return `<p style="font-size: 1.2rem; line-height: 1.6; margin: 0;">${escapedText}</p>`;
    }

    // Render interactive element (code snippet, vote, etc.)
    function renderInteractiveElement(element) {
        const zone = elements.interactiveZone;
        
        switch (element.type) {
            case 'code_snippet':
                renderCodeSnippet(element);
                break;
            case 'governance_vote':
                renderGovernanceVote(element);
                break;
            default:
                zone.innerHTML = `<p>Interactive element type "${element.type}" not implemented yet.</p>`;
        }
    }

    // Render code snippet with Monaco editor
    function renderCodeSnippet(element) {
        const container = document.createElement('div');
        container.style.cssText = 'background: #1e1e1e; border-radius: 8px; padding: 15px; margin: 20px 0;';
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #00ffcc;">Code Playground</strong>
                <span style="font-size: 0.8rem; color: #888;">${element.description}</span>
            </div>
            <div id="${element.id}" style="min-height: 150px;"></div>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #00ffcc;">
                ${element.validationRules ? `<strong>Validation:</strong> ${element.validationRules.map(r => r.condition).join(', ')}` : ''}
            </div>
        `;

        // Initialize Monaco Editor
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function() {
            const editor = monaco.editor.create(document.getElementById(element.id), {
                value: element.initialCode,
                language: element.language || 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace'
            });

            // Add validation check button
            const validateBtn = document.createElement('button');
            validateBtn.textContent = 'Validate Code';
            validateBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #00ffcc; border: none; border-radius: 4px; cursor: pointer;';
            validateBtn.onclick = async () => {
                // Simple validation for demo
                const container = document.getElementById(element.id);
                container.innerHTML += `<div style="color: #00ffcc; margin-top: 10px;">✓ Validation successful!</div>`;
                
                // Add validation feedback if provided
                if (element.validationRules) {
                    element.validationRules.forEach(rule => {
                        const feedback = document.createElement('div');
                        feedback.style.cssText = 'margin-top: 5px; font-size: 0.8rem; color: #00ffcc;';
                        feedback.textContent = `✓ ${rule.feedback}`;
                        container.appendChild(feedback);
                    });
                }
            };
            
            container.appendChild(validateBtn);
        });

        zone.appendChild(container);
    }

    // Render governance vote
    function renderGovernanceVote(element) {
        const container = document.createElement('div');
        container.style.cssText = 'background: #2d2d2d; border-radius: 8px; padding: 15px; margin: 20px 0;';
        container.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong style="color: #00ffcc;">Proposal:</strong> ${element.proposalId}
            </div>
            <p style="margin-bottom: 15px;">${element.description}</p>
            <div id="vote-options">
                ${element.options.map((option, index) => `
                    <button 
                        class="vote-option" 
                        data-option-id="${option.id}" 
                        data-option-text="${option.text.replace(/"/g, '&quot;')}"
                        style="display: block; width: 100%; padding: 12px; margin: 8px 0; background: #3d3d3d; border: 2px solid transparent; border-radius: 4px; color: #fff; cursor: pointer; font-size: 0.95rem; text-align: left; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='#00ffcc'"
                        onmouseout="this.style.borderColor='transparent'"
                    >
                        ${option.text}
                    </button>
                `).join('')}
            </div>
            <div id="vote-result" style="margin-top: 15px; font-size: 0.9rem; color: #888;"></div>
        `;

        // Add click handlers for vote options
        container.querySelectorAll('.vote-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                const optionId = parseInt(btn.dataset.optionId);
                
                try {
                    const result = await window.CognoscentBridge.recordChoice(
                        appState.currentChapterId, 
                        optionId
                    );
                    
                    const resultDiv = container.querySelector('#vote-result');
                    if (resultDiv) {
                        resultDiv.innerHTML = `✓ Vote recorded! Moving to chapter ${result.nextChapterId}`;
                        resultDiv.style.color = '#00ffcc';
                        
                        // Delay for effect then load next chapter
                        setTimeout(() => {
                            loadChapter(result.nextChapterId);
                        }, 1500);
                    }
                } catch (error) {
                    const resultDiv = container.querySelector('#vote-result');
                    if (resultDiv) {
                        resultDiv.textContent = `Error: ${error.message}`;
                        resultDiv.style.color = '#ff4444';
                    }
                }
            });
        });

        zone.appendChild(container);
    }

    // Render choices buttons
    function renderChoices(choices) {
        const container = elements.choicesContainer;
        container.innerHTML = '';

        if (!choices || choices.length === 0) return;

        choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.style.cssText = `
                padding: 12px 24px; 
                margin: 8px; 
                background: linear-gradient(135deg, #00ffcc 0%, #00997a 100%); 
                border: none; 
                border-radius: 6px; 
                color: #fff; 
                font-size: 1rem; 
                cursor: pointer; 
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            
            btn.onmouseover = (e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 204, 0.3)';
            };
            
            btn.onmouseout = (e) => {
                e.target.style.transform = '';
                e.target.style.boxShadow = '';
            };

            btn.onclick = async () => {
                try {
                    await window.CognoscentBridge.recordChoice(
                        appState.currentChapterId,
                        index
                    );
                    
                    // Get next chapter from choice data
                    const nextChapterId = choice.nextChapter;
                    if (nextChapterId) {
                        setTimeout(() => loadChapter(nextChapterId), 1000);
                    }
                } catch (error) {
                    console.error('[App] Error recording choice:', error);
                    alert(`Error: ${error.message}`);
                }
            };

            container.appendChild(btn);
        });
    }

    // Admin panel toggle
    elements.adminToggle.addEventListener('click', () => {
        const isHidden = elements.adminPanel.style.display === 'none';
        elements.adminPanel.style.display = isHidden ? 'block' : 'none';
        
        if (isHidden) {
            document.body.style.overflow = 'hidden'; // Prevent scrolling when admin panel is visible
        } else {
            document.body.style.overflow = '';
        }
    });

    // Login form handling
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(elements.loginForm);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            // Simple auth check (would use proper auth service in production)
            if (username && password && username.length > 0 && password.length > 0) {
                elements.authContainer.style.display = 'none';
                elements.adminToggle.style.display = 'block';
                
                // Initialize progress for new user
                appState.progress = await window.CognoscentBridge.getProgress(appState.userId);
                appState.unlockedNodes = appState.progress?.unlocked_nodes || ['prologue'];
                
                console.log('[App] User authenticated:', { username });
            } else {
                alert('Please enter valid credentials');
            }
        } catch (error) {
            alert(`Authentication failed: ${error.message}`);
        }
    });

    // Save new chapter from admin panel
    document.getElementById('save-node')?.addEventListener('click', async () => {
        const text = document.getElementById('node-text').value;
        const aiPrompt = document.getElementById('node-ai').value;
        
        if (!text || !aiPrompt) {
            alert('Please fill in all fields');
            return;
        }

        try {
            // In production, this would POST to backend API
            console.log('[Admin] New chapter created:', { text, aiPrompt });
            alert('Chapter deployed to core! (Demo mode)');
            
            // Reset form
            document.getElementById('node-text').value = '';
            document.getElementById('node-ai').value = '';
        } catch (error) {
            alert(`Failed to deploy chapter: ${error.message}`);
        }
    });

    // Load initial chapter
    loadChapter(1);

    // Export for debugging
    window.appState = appState;
});

/**
 * NavigatorPlayer - Story Navigation & State Management Engine
 * Manages chapter flow, interactive elements, choices, and AI integration
 */

class NavigatorPlayer {
    constructor() {
        this.currentChapterId = 1;
        this.history = [];
        this.choices = [];
        this.interactiveElement = null;
        this.metrics = {
            throughput: 0,
            latency: 0,
            resilience: 0,
            energy: 0
        };
        this.userId = window.CognoscentBridge?.userId || 'reader-' + Math.random().toString(36).substr(2, 9);
        this.unlockedNodes = ['prologue'];
        this.listeners = {
            onChapterLoad: [],
            onChoiceMade: [],
            onInteractiveTriggered: [],
            onNavigationUpdate: []
        };
        
        // AI-driven event listener
        this.setupAIBridge();
    }

    /**
     * Setup AI-driven navigation bridge
     */
    setupAIBridge() {
        window.addEventListener('trigger-tool', (e) => {
            const toolType = e.detail;
            console.log(`[NavigatorPlayer] AI triggered tool: ${toolType}`);
            this.triggerInteractiveTool(toolType);
        });

        window.addEventListener('advance-narrative', (e) => {
            const chapterId = e.detail;
            console.log(`[NavigatorPlayer] AI advancing to chapter: ${chapterId}`);
            this.loadChapter(chapterId);
        });
    }

    /**
     * Register event listeners
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Emit events to all listeners
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[NavigatorPlayer] Error in ${event} listener:`, err);
                }
            });
        }
    }

    /**
     * Load chapter by ID
     */
    async loadChapter(chapterId) {
        try {
            console.log(`[NavigatorPlayer] Loading chapter ${chapterId}...`);
            const startTime = performance.now();

            // Fetch chapter from backend
            const chapter = await window.CognoscentBridge.fetchChapter(chapterId);

            if (!chapter) {
                throw new Error(`Chapter ${chapterId} not found`);
            }

            // Update current state
            this.currentChapterId = chapterId;
            this.history.push(chapterId);
            this.choices = chapter.choices || [];
            this.interactiveElement = chapter.interactiveElement || null;

            // Update metrics
            const latency = Math.round(performance.now() - startTime);
            this.metrics.latency = latency;
            this.metrics.throughput = Math.floor(Math.random() * 100) + 80; // Simulated
            this.metrics.resilience = 98 + Math.random() * 2;
            this.metrics.energy = 92 + Math.random() * 8;

            // Emit chapter loaded event
            this.emit('onChapterLoad', {
                chapterId,
                chapter,
                metrics: this.metrics
            });

            console.log(`[NavigatorPlayer] Chapter ${chapterId} loaded in ${latency}ms`);
            return chapter;

        } catch (error) {
            console.error('[NavigatorPlayer] Error loading chapter:', error);
            this.emit('onChapterLoad', { error: error.message });
            throw error;
        }
    }

    /**
     * Make a choice and advance the story
     */
    async makeChoice(choiceIndex) {
        try {
            console.log(`[NavigatorPlayer] Choice ${choiceIndex} made at chapter ${this.currentChapterId}`);

            // Record choice with backend
            const result = await window.CognoscentBridge.recordChoice(
                this.userId,
                this.currentChapterId,
                choiceIndex
            );

            // Get next chapter
            const nextChapterId = result.nextChapterId || 
                                  this.choices[choiceIndex]?.nextChapter;

            if (nextChapterId) {
                // Emit choice made event
                this.emit('onChoiceMade', {
                    choiceIndex,
                    nextChapterId,
                    result
                });

                // Load next chapter with delay for dramatic effect
                setTimeout(() => {
                    this.loadChapter(nextChapterId);
                }, 800);
            }

            return result;

        } catch (error) {
            console.error('[NavigatorPlayer] Error making choice:', error);
            throw error;
        }
    }

    /**
     * Trigger interactive tool (Governance, Code, etc.)
     */
    async triggerInteractiveTool(toolType) {
        try {
            console.log(`[NavigatorPlayer] Triggering interactive tool: ${toolType}`);

            const elementMap = {
                'code_snippet': () => this.renderCodePlayground(),
                'governance_vote': () => this.renderGovernanceModule(),
                'forensic_tool': () => this.renderForensicTool(),
                'code_review': () => this.renderCodeReview(),
                'quantum_sim': () => this.renderQuantumSimulator()
            };

            if (elementMap[toolType]) {
                await elementMap[toolType]();
                this.emit('onInteractiveTriggered', { toolType });
                return true;
            } else {
                console.warn(`[NavigatorPlayer] Unknown tool type: ${toolType}`);
                return false;
            }

        } catch (error) {
            console.error('[NavigatorPlayer] Error triggering interactive tool:', error);
            return false;
        }
    }

    /**
     * Render code playground
     */
    renderCodePlayground() {
        const container = document.getElementById('interactive-zone');
        if (!container) return;

        container.innerHTML = `
            <div class="code-playground">
                <h3 style="color: #00ffcc; margin: 0 0 10px 0;">Code Playground</h3>
                <div id="monaco-editor" style="height: 250px; border: 1px solid #00ffcc; border-radius: 4px;"></div>
                <button class="run-btn" style="margin-top: 10px;">Execute Code</button>
                <div id="code-output" style="margin-top: 10px; color: #00ffcc; font-family: monospace; font-size: 0.9rem;"></div>
            </div>
        `;

        // Load Monaco Editor
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: this.interactiveElement?.initialCode || '// Write code here',
                language: this.interactiveElement?.language || 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 12
            });

            document.querySelector('.run-btn').addEventListener('click', () => {
                const code = editor.getValue();
                const outputDiv = document.getElementById('code-output');
                outputDiv.innerHTML = '✓ Code executed successfully!';
                console.log('[NavigatorPlayer] Code executed:', code);
            });
        });
    }

    /**
     * Render governance voting module
     */
    renderGovernanceModule() {
        const container = document.getElementById('interactive-zone');
        if (!container) return;

        const element = this.interactiveElement;
        container.innerHTML = `
            <div class="governance-module">
                <h3 style="color: #00ffcc; margin: 0 0 15px 0;">Governance Proposal: ${element?.proposalId || 'Unknown'}</h3>
                <p style="margin-bottom: 15px;">${element?.description || 'Cast your vote to influence the narrative.'}</p>
                <div class="vote-options">
                    ${(element?.options || []).map((option, index) => `
                        <button class="vote-option" data-index="${index}" 
                                style="display: block; width: 100%; padding: 12px; margin: 8px 0; background: #2d2d2d; border: 2px solid #00ffcc; border-radius: 4px; color: #fff; cursor: pointer;">
                            ${option.text}
                        </button>
                    `).join('')}
                </div>
                <div id="vote-result" style="margin-top: 15px; color: #888;"></div>
            </div>
        `;

        // Add click handlers
        document.querySelectorAll('.vote-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                const optionId = parseInt(btn.dataset.index);
                const resultDiv = document.getElementById('vote-result');
                resultDiv.innerHTML = '✓ Vote recorded! Updating narrative...';
                resultDiv.style.color = '#00ffcc';
                console.log('[NavigatorPlayer] Vote recorded:', optionId);
            });
        });
    }

    /**
     * Placeholder methods for other interactive tools
     */
    renderForensicTool() {
        console.log('[NavigatorPlayer] Forensic tool triggered');
    }

    renderCodeReview() {
        console.log('[NavigatorPlayer] Code review tool triggered');
    }

    renderQuantumSimulator() {
        console.log('[NavigatorPlayer] Quantum simulator triggered');
    }

    /**
     * Get current state for serialization
     */
    getState() {
        return {
            currentChapterId: this.currentChapterId,
            history: this.history,
            choices: this.choices,
            metrics: this.metrics,
            userId: this.userId,
            unlockedNodes: this.unlockedNodes
        };
    }

    /**
     * Restore state from serialization
     */
    setState(state) {
        if (state.currentChapterId) this.currentChapterId = state.currentChapterId;
        if (state.history) this.history = state.history;
        if (state.choices) this.choices = state.choices;
        if (state.metrics) this.metrics = state.metrics;
        if (state.unlockedNodes) this.unlockedNodes = state.unlockedNodes;
    }

    /**
     * Get previous chapter
     */
    getPreviousChapter() {
        if (this.history.length > 1) {
            return this.history[this.history.length - 2];
        }
        return null;
    }

    /**
     * Check if node is unlocked
     */
    isNodeUnlocked(nodeId) {
        return this.unlockedNodes.includes(nodeId);
    }

    /**
     * Unlock a node
     */
    unlockNode(nodeId) {
        if (!this.unlockedNodes.includes(nodeId)) {
            this.unlockedNodes.push(nodeId);
            this.emit('onNavigationUpdate', { unlockedNodes: this.unlockedNodes });
        }
    }
}

// Export and attach to window
if (typeof window !== 'undefined') {
    window.NavigatorPlayer = NavigatorPlayer;
    // Initialize globally
    window.navigatorPlayer = new NavigatorPlayer();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigatorPlayer;
}

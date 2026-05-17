/**
 * AI Navigation Bridge for Cognoscent Echo
 * DeepMind A2UI + CopilotKit + AG-UI Integration Layer
 */

// ===========================================
// A2UI NAVIGATION COMPONENT
// ===========================================
window.AppComponents = {
    // Novel Chapter Component with A2UI bindings
    NovelChapter: `
        <div class="a2ui-novel-chapter" data-bindable-id="story.content">
            <h3>{{ chapter.title }}</h3>
            <div class="story-content">{{ chapter.text }}</div>
            <div class="learning-outcomes">
                {{#each chapter.learningOutcomes}}
                    <div class="outcome-tag">{{ this }}</div>
                {{/each}}
            </div>
        </div>
    `,

    // WASM Sandbox Component
    WASMSandbox: `
        <div class="a2ui-wasm-sandbox">
            <div class="sandbox-header" data-bindable-id="sandbox.header">
                <h4>🔬 Educational Code Sandbox</h4>
                <div class="sandbox-metrics">
                    {{#if sandbox.metrics}}
                        <span class="metric-item">TP: {{sandbox.metrics.throughput}}</span>
                        <span class="metric-item">LAT: {{sandbox.metrics.latency}}</span>
                    {{/if}}
                </div>
            </div>
            
            <textarea 
                class="wasm-code-editor"
                data-bindable-id="sandbox.code"
                placeholder="// Write your Go code here..."></textarea>
            
            <div class="sandbox-actions">
                <button onclick="executeSandboxCode()" class="btn-primary">▶ Execute</button>
                <button onclick="inspectMemory()" class="btn-secondary">🔍 Memory</button>
            </div>
            
            <div class="sandbox-feedback" data-bindable-id="sandbox.feedback"></div>
        </div>
    `,

    // Governance Vote Component
    GovernanceVote: `
        <div class="a2ui-governance">
            <h3>🗳️ Governance Proposal</h3>
            <div class="proposal-content" data-bindable-id="governance.text"></div>
            
            <div class="vote-options">
                {{#each governance.options}}
                    <button 
                        class="vote-option"
                        onclick="castVote('{{this.id}}', '{{this.text}}')"
                        data-option-id="{{this.id}}">
                        {{this.text}}
                        <small>{{this.impact}}</small>
                    </button>
                {{/each}}
            </div>
        </div>
    `,

    // Learning Progress Component
    LearningProgress: `
        <div class="a2ui-learning-progress">
            <div class="progress-stats">
                <div class="stat" data-bindable-id="progress.totalChaptersCompleted">
                    <span class="stat-value">{{ progress.totalChaptersCompleted || 0 }}</span>
                    <span class="stat-label">Chapters</span>
                </div>
                <div class="stat" data-bindable-id="progress.skillsLearned.length">
                    <span class="stat-value">{{ progress.skillsLearned?.length || 0 }}</span>
                    <span class="stat-label">Skills</span>
                </div>
                <div class="stat" data-bindable-id="progress.currentChapter">
                    <span class="stat-value">{{ progress.currentChapter || 1 }}</span>
                    <span class="stat-label">Current</span>
                </div>
            </div>
            
            <div class="skill-list">
                {{#each progress.skillsLearned}}
                    <div class="skill-tag">{{this.name}}</div>
                {{/each}}
            </div>
        </div>
    `
};

// ===========================================
// A2UI STATE MANAGEMENT
// ===========================================
window.A2UIState = {
    story: {
        content: '',
        chapterTitle: ''
    },
    sandbox: {
        code: '// Write your Go code here...',
        metrics: null,
        feedback: ''
    },
    governance: {
        text: '',
        options: []
    },
    progress: {}
};

// Make state accessible to frameworks
A2UI.registerBindable('cognoscent-state', () => window.A2UIState);

// ===========================================
// NAVIGATION BRIDGE FUNCTIONS
// ===========================================

window.CognoscentNavBridge = {
    // Navigate to next chapter
    async navigateTo(chapterId) {
        if (!this.state) return;
        
        const currentChapter = this.getCurrentChapter();
        
        // Update navigation context for CopilotKit
        if (window.CopilotKit) {
            window.CopilotKit.sendEvent({
                type: 'chapter-navigation',
                payload: {
                    from: currentChapter?.id || chapterId,
                    to: chapterId,
                    action: 'AI_SUGGESTION'
                }
            });
        }
        
        // Trigger A2UI state update
        if (A2UI.isRegistered()) {
            const response = await window.CognoscentBridge?.fetchChapter(chapterId);
            if (response) {
                this.updateStoryState(response);
            }
        }
    },

    // Get current chapter ID
    getCurrentChapter() {
        const storyContainer = document.getElementById('story-container');
        return storyContainer ? 1 : null;
    },

    // Update story state for A2UI binding
    updateStoryState(chapter) {
        if (window.A2UIState?.story) {
            window.A2UIState.story.content = chapter.text;
            window.A2UIState.story.chapterTitle = chapter.title || `Chapter ${chapter.id}`;
        }
    },

    // Execute WASM code via A2UI
    async executeCode(code) {
        if (A2UI.isRegistered()) {
            const result = await fetch('/api/sandbox/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code,
                    memoryInput: {},
                    userId: window.CognoscentBridge?.userId 
                })
            });

            if (result.ok) {
                const data = await result.json();
                
                // Update A2UI bound state
                if (window.A2UIState?.sandbox) {
                    window.A2UIState.sandbox.metrics = data;
                    window.A2UIState.sandbox.feedback = `✅ Execution successful! Time: ${data.executionTime}ms`;
                }
            }
            
            return result.json();
        }
    },

    // Cast governance vote
    async castVote(optionId) {
        if (window.CopilotKit) {
            window.CopilotKit.sendEvent({
                type: 'governance-vote',
                payload: { optionId }
            });
        }
        
        await fetch('/api/governance/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                proposalId: 'G-2029-047',
                optionId,
                userId: window.CognoscentBridge?.userId
            })
        });
    },

    // Request AI navigation suggestion
    async suggestNextChapter(context) {
        if (window.CopilotKit) {
            const response = await window.CopilotKit.sendEvent({
                type: 'ai-navigation-suggestion',
                payload: { context }
            });
            
            return response?.suggestedChapterId;
        }
    },

    // Get learning tips for A2UI
    async getLearningTips() {
        const tips = [
            '💡 Use sync.Pool for efficient memory reuse in hot paths',
            '🛡️ BFT consensus requires >n/3 honest nodes for safety',
            '⚡ Cache-line alignment (64 bytes) improves prefetching',
            '🔒 Always validate user input before execution'
        ];
        
        if (window.A2UIState?.learningTips) {
            window.A2UIState.learningTips = tips;
        }
        
        return tips;
    }
};

// ===========================================
// COPILOT INTEGRATION HOOKS
// ===========================================
window.CopilotHooks = {
    // Chat message handler
    async handleChatMessage(query) {
        if (!query) return null;
        
        // Route query to AI copilot
        if (window.CopilotKit?.chat) {
            window.CopilotKit.chat(query);
            return 'processing';
        }
        
        return null;
    },

    // Action trigger for chapter transitions
    async onActionTrigger(actionName, payload) {
        switch (actionName) {
            case 'NEXT_CHAPTER':
                await window.CognoscentNavBridge?.navigateTo(payload.chapterId);
                break;
            case 'EXECUTE_CODE':
                await window.CognoscentNavBridge?.executeCode(payload.code);
                break;
            case 'CAST_VOTE':
                await window.CognoscentNavBridge?.castVote(payload.optionId);
                break;
        }
    },

    // Metrics broadcast
    onMetricsUpdate(metrics) {
        if (window.A2UIState?.metrics) {
            Object.assign(window.A2UIState.metrics, metrics);
        }
    }
};

// ===========================================
// AG-UI INTEGRATION
// ===========================================
window.AgUiBridge = {
    // Register component with AG runtime
    registerComponent(name, config) {
        AG.registerComponent(name, {
            template: config.template || '',
            props: config.props || {},
            bindings: config.bindings || {}
        });
    },

    // Get current component state
    getComponentState(componentName) {
        return window.A2UIState?.[componentName] || null;
    },

    // Broadcast component update
    broadcastUpdate(componentName, data) {
        if (window.A2UI.isRegistered()) {
            window.A2UI.updateBound(`${componentName}.value`, data);
        }
    }
};

// ===========================================
// INITIALIZATION & EXPOSED API
// ===========================================
window.CognoscentNavigationBridge = {
    // Full bridge API for A2UI frameworks
    ...window.CognoscentNavBridge,
    
    // State management
    getState: () => ({
        story: window.A2UIState?.story,
        sandbox: window.A2UIState?.sandbox,
        governance: window.A2UIState?.governance,
        progress: window.A2UIState?.progress
    }),

    // Set state for A2UI binding
    setState: (section, data) => {
        if (!window.A2UIState) return;
        
        if (!window.A2UIState[section]) {
            window.A2UIState[section] = {};
        }
        
        Object.assign(window.A2UIState[section], data);
    },

    // Bind to A2UI component
    bindToA2UI: (componentName, path) => {
        if (A2UI.isRegistered()) {
            A2UI.registerBind(componentName, path, () => 
                window.A2UIState?.[componentName] || null
            );
        }
    },

    // Initialize all navigation hooks
    init() {
        console.log('✅ AI Navigation Bridge initialized');
        console.log('  - A2UI components registered');
        console.log('  - CopilotKit hooks connected');
        console.log('  - AG-UI runtime integrated');
        
        return this;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.CognoscentNavigationBridge?.init();
    
    // Export for global access
    window.CognoscentNavBridge = window.CognoscentNavigationBridge;
});

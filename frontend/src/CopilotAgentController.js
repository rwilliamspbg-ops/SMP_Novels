/**
 * CopilotKit Agent Integration
 * Handles AI-driven story navigation and interactive tool triggering
 */

class CopilotAgentController {
    constructor(narratorPlayer) {
        this.narratorPlayer = narratorPlayer;
        this.setupAgentActions();
    }

    /**
     * Setup all co-pilot agent actions
     */
    setupAgentActions() {
        // Register the narrative advancement action
        this.registerAdvanceNarrativeAction();
        
        // Register the interactive tool trigger action
        this.registerTriggerToolAction();
        
        // Register the choice guidance action
        this.registerChoiceGuidanceAction();
        
        // Register the narrative analysis action
        this.registerNarrativeAnalysisAction();
        
        console.log('[CopilotAgent] All agent actions registered');
    }

    /**
     * Advance the narrative to a specific chapter
     */
    registerAdvanceNarrativeAction() {
        if (window.useCopilotAction) {
            window.useCopilotAction({
                name: 'advance_narrative',
                displayName: 'Advance Chapter',
                description: 'Move the story forward to the specified chapter',
                parameters: [
                    {
                        name: 'chapterId',
                        type: 'number',
                        description: 'The ID of the chapter to navigate to',
                        required: true
                    }
                ],
                handler: async (args) => {
                    try {
                        console.log(`[CopilotAgent] Advancing narrative to chapter ${args.chapterId}`);
                        await this.narratorPlayer.loadChapter(args.chapterId);
                        return {
                            success: true,
                            message: `Narrative synchronized. Entering Chapter ${args.chapterId}.`,
                            chapter: this.narratorPlayer.currentChapterId
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            });
        }
    }

    /**
     * Trigger an interactive tool
     */
    registerTriggerToolAction() {
        if (window.useCopilotAction) {
            window.useCopilotAction({
                name: 'trigger_interactive_tool',
                displayName: 'Activate Tool',
                description: 'Trigger an interactive tool (code editor, governance vote, etc.)',
                parameters: [
                    {
                        name: 'toolType',
                        type: 'string',
                        description: 'Type of tool: code_snippet, governance_vote, forensic_tool, code_review, quantum_sim',
                        required: true
                    }
                ],
                handler: async (args) => {
                    try {
                        console.log(`[CopilotAgent] Triggering tool: ${args.toolType}`);
                        const success = await this.narratorPlayer.triggerInteractiveTool(args.toolType);
                        return {
                            success,
                            message: success 
                                ? `${args.toolType} module activated. The interface is now responsive.`
                                : `Failed to activate ${args.toolType}. Tool not recognized.`,
                            toolType: args.toolType
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            });
        }
    }

    /**
     * Provide guidance on available choices
     */
    registerChoiceGuidanceAction() {
        if (window.useCopilotAction) {
            window.useCopilotAction({
                name: 'guide_choice',
                displayName: 'Choice Guidance',
                description: 'Analyze available choices and recommend next action',
                parameters: [
                    {
                        name: 'analysisDepth',
                        type: 'string',
                        description: 'Depth of analysis: brief, detailed, strategic',
                        required: false
                    }
                ],
                handler: async (args) => {
                    try {
                        const choices = this.narratorPlayer.choices || [];
                        const depth = args.analysisDepth || 'brief';
                        
                        let analysis = `Currently at Chapter ${this.narratorPlayer.currentChapterId}. Available choices:\n`;
                        choices.forEach((choice, idx) => {
                            analysis += `${idx + 1}. ${choice.text}\n`;
                        });
                        
                        return {
                            success: true,
                            message: analysis,
                            choiceCount: choices.length,
                            analysisDepth: depth
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            });
        }
    }

    /**
     * Analyze current narrative state
     */
    registerNarrativeAnalysisAction() {
        if (window.useCopilotAction) {
            window.useCopilotAction({
                name: 'analyze_narrative',
                displayName: 'Narrative Analysis',
                description: 'Analyze current story state and player progress',
                parameters: [],
                handler: async () => {
                    try {
                        const state = this.narratorPlayer.getState();
                        return {
                            success: true,
                            state: {
                                currentChapter: state.currentChapterId,
                                chaptersExplored: state.history.length,
                                unlockedNodes: state.unlockedNodes.length,
                                metrics: state.metrics
                            },
                            message: `Story Progress: Chapter ${state.currentChapterId}, ${state.history.length} chapters explored, ${state.unlockedNodes.length} nodes unlocked`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            });
        }
    }

    /**
     * Emit AI-driven narrative advancement event
     */
    emitAdvanceNarrative(chapterId) {
        window.dispatchEvent(new CustomEvent('advance-narrative', { detail: chapterId }));
    }

    /**
     * Emit AI-driven tool trigger event
     */
    emitTriggerTool(toolType) {
        window.dispatchEvent(new CustomEvent('trigger-tool', { detail: toolType }));
    }
}

// Initialize globally if NavigatorPlayer is available
if (typeof window !== 'undefined') {
    window.CopilotAgentController = CopilotAgentController;
    
    // Wait for NavigatorPlayer to be available, then initialize
    const initCopilot = setInterval(() => {
        if (window.navigatorPlayer) {
            window.copilotAgentController = new CopilotAgentController(window.navigatorPlayer);
            clearInterval(initCopilot);
        }
    }, 100);
    
    // Fallback: initialize after a reasonable time
    setTimeout(() => {
        if (!window.copilotAgentController && window.navigatorPlayer) {
            window.copilotAgentController = new CopilotAgentController(window.navigatorPlayer);
        }
    }, 5000);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CopilotAgentController;
}

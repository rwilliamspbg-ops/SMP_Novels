/**
 * MCP Server for Cognoscent Echo
 * Model Context Protocol (MCP) implementation for AG-UI integration
 */

const { McpServer, Tool, Prompt } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const WebSocket = require('ws');

// ===========================================
// MCP SERVER INITIALIZATION
// ===========================================
const mcpServer = new McpServer({
    name: 'cognoscent-echo',
    version: '2.0.0'
});

// ===========================================
// TOOLS FOR INTERACTIVE NOVEL PLATFORM
// ===========================================

// Tool: Get current chapter content
mcpServer.tool(
    'get_chapter_content',
    {
        chapterId: {
            type: 'integer',
            description: 'The ID of the chapter to retrieve'
        }
    },
    async ({ chapterId }) => {
        try {
            const response = await fetch(`/api/chapter/${chapterId}`);
            if (!response.ok) {
                throw new Error('Chapter not found');
            }
            
            const chapter = await response.json();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            title: chapter.title || `Chapter ${chapterId}`,
                            text: chapter.text,
                            choices: chapter.choices?.map(c => c.text).join(', ') || 'No choices available'
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching chapter: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
);

// Tool: Navigate to next chapter
mcpServer.tool(
    'navigate_chapter',
    {
        currentChapterId: {
            type: 'integer',
            description: 'Current chapter ID'
        },
        choiceIndex: {
            type: 'integer',
            description: 'Choice index to select (0-based)'
        }
    },
    async ({ currentChapterId, choiceIndex }) => {
        try {
            const response = await fetch('/api/choice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: window.CognoscentBridge?.userId || 'guest',
                    chapterId: currentChapterId,
                    choiceIndex
                })
            });

            if (!response.ok) {
                throw new Error('Navigation failed');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `Successfully navigated to chapter ${currentChapterId + choiceIndex}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Navigation error: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
);

// Tool: Execute WASM code in sandbox
mcpServer.tool(
    'execute_wasm_sandbox',
    {
        code: {
            type: 'string',
            description: 'Go code to execute in the sandbox'
        }
    },
    async ({ code }) => {
        try {
            const response = await fetch('/api/sandbox/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    memoryInput: {},
                    userId: window.CognoscentBridge?.userId || 'guest'
                })
            });

            if (!response.ok) {
                throw new Error('Sandbox execution failed');
            }

            const result = await response.json();
            return {
                content: [
                    {
                        type: 'text',
                        text: `WASM execution successful! Time: ${result.executionTime}ms`
                    },
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Sandbox error: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
);

// Tool: Record governance vote
mcpServer.tool(
    'record_governance_vote',
    {
        proposalId: {
            type: 'string',
            description: 'Proposal ID (e.g., G-2029-047)'
        },
        optionId: {
            type: 'string',
            description: 'Option ID to vote for'
        }
    },
    async ({ proposalId, optionId }) => {
        try {
            const response = await fetch('/api/governance/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proposalId,
                    optionId,
                    userId: window.CognoscentBridge?.userId || 'guest'
                })
            });

            if (!response.ok) {
                throw new Error('Vote recording failed');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `Vote recorded for proposal ${proposalId}, option ${optionId}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Governance voting error: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
);

// Tool: Get learning progress
mcpServer.tool(
    'get_learning_progress',
    {
        userId: {
            type: 'string',
            description: 'User ID for progress tracking'
        }
    },
    async ({ userId }) => {
        try {
            const response = await fetch(`/api/progress/${userId}`);
            
            if (!response.ok) {
                throw new Error('No progress found');
            }

            const progress = await response.json();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            totalChaptersCompleted: progress.totalChaptersCompleted,
                            currentChapter: progress.currentChapter,
                            skillsLearned: progress.skillsLearned?.length || 0,
                            educationalMilestones: progress.educationalMilestones?.length || 0
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Progress lookup error: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
);

// Tool: Get AI character response
mcpServer.tool(
    'get_character_response',
    {
        character: {
            type: 'string',
            description: 'Character name (Elias, Priya, or Governor)'
        },
        context: {
            type: 'string',
            description: 'Context for the conversation'
        }
    },
    async ({ character, context }) => {
        try {
            const response = await fetch('/api/ai-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character,
                    context,
                    userId: window.CognoscentBridge?.userId || 'guest'
                })
            });

            if (!response.ok) {
                throw new Error('Character response failed');
            }

            const responseData = await response.json();
            return {
                content: [
                    {
                        type: 'text',
                        text: `${character}: "${responseData.response}"`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Character response error: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
);

// ===========================================
// PROMPTS FOR AI ASSISTANCE
// ===========================================

mcpServer.prompt('ask_character', {
    characterName: {
        type: 'string',
        description: 'Which character to consult?'
    },
    question: {
        type: 'string',
        description: 'Your question about the story or technical concepts'
    }
}, async ({ characterName, question }) => {
    return [
        {
            mimeType: 'text/plain',
            text: `I'll ask ${characterName}: "${question}"`
        },
        {
            mimeType: 'application/json',
            text: JSON.stringify({
                toolCall: 'get_character_response',
                params: { character: characterName, context: question }
            })
        }
    ];
});

mcpServer.prompt('analyze_memory_layout', {
    memorySnapshot: {
        type: 'string',
        description: 'Current memory snapshot from WASM sandbox'
    }
}, async ({ memorySnapshot }) => {
    return [
        {
            mimeType: 'text/plain',
            text: `Analyzing memory layout:\n${memorySnapshot}\n\nKey patterns identified:`
        },
        {
            mimeType: 'application/json',
            text: JSON.stringify({
                analysis: 'Cache-line aligned descriptors detected',
                recommendations: [
                    'Maintain 64-byte alignment for optimal prefetching',
                    'Use zero-copy where possible for high-throughput paths'
                ]
            })
        }
    ];
});

// ===========================================
// METRICS SOCKET FOR REAL-TIME UPDATES
// ===========================================
function createMetricsSocket() {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.on('open', () => {
        console.log('✅ MCP Server metrics socket connected');
    });
    
    ws.on('message', (data) => {
        try {
            const metrics = JSON.parse(data);
            // Update bound state if available
            if (window.CognoscentState?.metrics) {
                window.CognoscentState.metrics = metrics;
            }
        } catch (e) {
            console.error('Metrics parse error:', e);
        }
    });
    
    ws.on('error', (error) => {
        console.error('Metrics socket error:', error);
    });
}

// Create socket on page load
window.addEventListener('load', () => {
    createMetricsSocket();
});

console.log('✅ MCP Server initialized for Cognoscent Echo');

module.exports = { mcpServer };

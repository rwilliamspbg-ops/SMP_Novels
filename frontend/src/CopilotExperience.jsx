/**
 * CopilotKit Experience Component for Cognoscent Echo
 * Integrates with DeepMind A2UI and AG-UI frameworks
 */

import React, { useState, useEffect } from 'react';
import { CopilotProvider } from '@copilotkit/react-core';
import { useCopilotAgent } from '@copilotkit/react-ui';

// ===========================================
// COPILOT CONFIGURATION
// ===========================================
export function CognoscentCopilot() {
    const agent = useCopilotAgent();
    
    // Copilot actions for chapter navigation
    const handleChapterNavigation = async (chapterId) => {
        await window.CognoscentBridge?.fetchChapter(chapterId);
    };

    // AI Copilot handlers
    const handleAIQuestion = async (question) => {
        // Query about chapter content
        if (question.includes('chapter') || question.includes('story')) {
            const currentChapter = document.getElementById('story-text');
            return currentChapter?.textContent || 'I can help with the story!';
        }
        
        // Ask about learning outcomes
        if (question.includes('learn') || question.includes('skill')) {
            return 'Great questions about learning! Try navigating through the chapters to discover interactive exercises and governance proposals.';
        }
        
        // Governance-related questions
        if (question.includes('vote') || question.includes('governance')) {
            return 'You can participate in governance voting when you reach a chapter with a BFT proposal. Look for the 🗳️ icon!';
        }
        
        // WASM sandbox questions
        if (question.includes('code') || question.includes('wasm')) {
            return 'The WASM sandbox lets you execute Go code safely and test your systems programming skills. Try the interactive exercises!';
        }
        
        return 'I\'m happy to help with the Cognoscent Echo story, learning progress, or governance voting!';
    };

    // Metrics update handler
    const handleMetricsUpdate = (metrics) => {
        if (window.CognoscentState?.metrics) {
            window.CognoscentState.metrics = metrics;
        }
    };

    return (
        <CopilotProvider>
            <div className="copilot-experience">
                {/* Invisible trigger for Copilot */}
                <button 
                    className="copilot-trigger-invisible"
                    onClick={() => agent?.chat('How can you help me with this interactive novel platform?')}
                />

                {/* Status indicator */}
                <div className="copilot-status">
                    <span className="status-dot"></span>
                    <span>Copilot Connected</span>
                </div>
            </div>

            {/* Inject Copilot UI components */}
            {agent && <CopilotUI />}
        </CopilotProvider>
    );
}

// ===========================================
// COPILOT UI COMPONENTS
// ===========================================
function CopilotUI() {
    const agent = useCopilotAgent();

    return (
        <>
            {/* Chat Sidebar */}
            <div className="copilot-chat-panel">
                <div className="chat-header">
                    <h3>AI Assistant</h3>
                    <span className="copilot-connected">● Connected</span>
                </div>
                
                <div className="chat-messages" id="copilot-messages"></div>
                
                <div className="chat-input-wrapper">
                    <input
                        type="text"
                        placeholder="Ask about chapters, learning, governance..."
                        className="copilot-chat-input"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                agent?.chat(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>

            {/* Context Panel */}
            <div className="copilot-context-panel hidden">
                <h4>Current Context</h4>
                <ul>
                    <li>Interactive Novel Platform</li>
                    <li>Chapter navigation active</li>
                    <li>Learning progress tracked</li>
                    <li>Governance voting available</li>
                </ul>
            </div>
        </>
    );
}

// ===========================================
// STYLES FOR Copilot Experience
// ===========================================
const styles = `
.copilot-experience {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
}

.copilot-trigger-invisible {
    position: fixed;
    opacity: 0;
    pointer-events: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.copilot-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    background: rgba(0, 255, 204, 0.1);
    border-radius: 20px;
    font-size: 14px;
    color: #00ffcc;
    margin-top: 10px;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #00ffcc;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}

.copilot-chat-panel {
    width: 350px;
    max-width: calc(100vw - 40px);
    background: rgba(15, 15, 35, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.chat-header {
    padding: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-header h3 {
    color: #00ffcc;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.copilot-connected {
    font-size: 12px;
    color: var(--primary);
}

.chat-messages {
    height: 300px;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.chat-input-wrapper {
    padding: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.copilot-chat-input {
    width: 100%;
    padding: 10px 15px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
}

.copilot-chat-input:focus {
    outline: none;
    border-color: var(--primary);
}

.copilot-context-panel {
    position: absolute;
    right: 370px;
    top: 20px;
    width: 250px;
    background: rgba(15, 15, 35, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.copilot-context-panel h4 {
    color: var(--primary);
    margin-bottom: 10px;
    font-size: 14px;
}

.copilot-context-panel ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.copilot-context-panel li {
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: 5px;
}
`;

// Inject styles globally
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

export default CognoscentCopilot;

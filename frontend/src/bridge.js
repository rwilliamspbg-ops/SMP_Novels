// Cognoscent Echo - Frontend API Bridge Layer
// Handles all communication between frontend and Fastify backend

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:3001';
const USER_ID = 'reader-' + Math.random().toString(36).substr(2, 9);

/**
 * Fetch chapter data from backend
 */
async function fetchChapter(chapterId) {
    try {
        const response = await fetch(`${API_BASE}/chapter/${chapterId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Chapter fetch failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Bridge] Fetch chapter error:', error.message);
        throw error;
    }
}

/**
 * Record reader choice and advance narrative
 */
async function recordChoice(userId, chapterId, choiceIndex) {
    try {
        const response = await fetch(`${API_BASE}/choice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userId,
                chapterId: parseInt(chapterId),
                choiceIndex: parseInt(choiceIndex)
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Choice recording failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Bridge] Record choice error:', error.message);
        throw error;
    }
}

/**
 * Get reader progress/state
 */
async function getProgress(userId) {
    try {
        const response = await fetch(`${API_BASE}/progress/${userId}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Progress fetch failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Bridge] Get progress error:', error.message);
        throw error;
    }
}

/**
 * Save reader metrics
 */
async function saveMetrics(userId, metrics) {
    try {
        const response = await fetch(`${API_BASE}/metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ userId, metrics })
        });
        
        if (!response.ok) {
            throw new Error(`Metrics save failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Bridge] Save metrics error:', error.message);
        throw error;
    }
}

/**
 * AI Response generation
 */
async function generateAIResponse(character, context, userId) {
    try {
        const response = await fetch(`${API_BASE}/ai-response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ character, context, userId })
        });
        
        if (!response.ok) {
            throw new Error(`AI response failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Bridge] AI response error:', error.message);
        throw error;
    }
}

/**
 * Governance vote recording
 */
async function recordVote(proposalId, optionId, userId) {
    try {
        const response = await fetch(`${API_BASE}/governance/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ proposalId, optionId, userId })
        });
        
        if (!response.ok) {
            throw new Error(`Vote recording failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Bridge] Record vote error:', error.message);
        throw error;
    }
}

/**
 * Get governance tally
 */
async function getGovernanceTally(proposalId) {
    try {
        const response = await fetch(`${API_BASE}/governance/tally/${proposalId}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Tally fetch failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Bridge] Get tally error:', error.message);
        throw error;
    }
}

/**
 * Export CognoscentBridge API for global access
 */
window.CognoscentBridge = {
    fetchChapter,
    recordChoice,
    getProgress,
    saveMetrics,
    generateAIResponse,
    recordVote,
    getGovernanceTally,
    
    // Legacy compatibility
    bridgeChoice: async (chapterId, choiceIndex) => {
        return await recordChoice(USER_ID, chapterId, choiceIndex);
    },
    
    userId: USER_ID,
    apiBase: API_BASE
};

// Expose to global scope for debugging
if (typeof window !== 'undefined') {
    window.CognoscentBridge = CognoscentBridge;
}

module.exports = CognoscentBridge;

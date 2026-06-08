const { executeTransactional, recordEvent } = require('../src/database_utils');

const narrativeData = {
  chapters: {
    1: {
      id: 1,
      text: "You awaken in the sterile hum of the Aegis Core. Elias Vance, the Lead Architect, stares at a cascading wall of diagnostic data. 'The FramePool is leaking,' he mutters, his voice strained. 'If we cannot stabilize the memory allocation, the entire Cognoscent Echo will collapse into noise.'",
      choices: [
        { text: "Ask Elias about the leak", nextChapter: 2 },
        { text: "Examine the terminal yourself", nextChapter: 3 }
      ],
      interactiveElement: {
        type: "code_snippet",
        id: "chapter1_framepool",
        language: "go",
        description: "Elias is optimizing the FramePool implementation",
        initialCode: "func NewFramePool(frameSize int) *FramePool {\n    return &FramePool{pool: sync.Pool{New: func() any {\n        return make([]byte, frameSize)\n    }}}\n}",
        validationRules: [{
            condition: "zero-copy",
            feedback: "? Great! This matches AF_XDP requirements."
        }]
      }
    },
    2: {
      id: 2,
      text: "Elias sighs, not looking away from the screen. 'It is a Byzantine failure in the consensus layer. The nodes are disagreeing on the state of the memory pool. We need a tighter BFT threshold or we lose everything.'",
      choices: [
        { text: "Suggest lowering the threshold", nextChapter: 4 },
        { text: "Argue for higher resilience", nextChapter: 5 }
      ],
      interactiveElement: {
        type: "governance_vote",
        proposalId: "G-2029-047",
        description: "Adjust the BFT Threshold for the Aegis Core Consensus Layer.",
        options: [
            { text: "Maintain 55.5% Threshold", impact: "OmniCorp attack increases tension." },
            { text: "Lower to 40% for speed", impact: "Vulnerability opens; centralization increases." }
        ]
      }
    },
    3: {
      id: 3,
      text: "The terminal flashes with red warnings. You see the AF_XDP descriptors failing to align. The throughput is dropping precipitously. You realize the leak isn't accidental; it is a coordinated attack on the memory fabric.",
      choices: [
        { text: "Alert Elias immediately", nextChapter: 2 },
        { text: "Try to patch the leak manually", nextChapter: 6 }
      ]
    },
    4: {
      id: 4,
      text: "The protocol stabilizes, but a sliver of vulnerability remains. The efficiency is higher, but you can feel the centralization creeping in. The Echo is quieter now, but less free.",
      choices: []
    },
    5: {
      id: 5,
      text: "You maintain the resilience. The system struggles, the latency spikes, but the integrity of the Cognoscent Echo holds. You have preserved the truth, though at the cost of performance.",
      choices: []
    },
    6: {
      id: 6,
      text: "Your quick fingers dance across the keys. You manage to redirect the leaking packets into a null-sink. The system breathes again, and Elias looks at you with newfound respect.",
      choices: [
        { text: "Discuss the implications with Elias", nextChapter: 2 }
      ]
    }
  },
  
  /**
   * Helper function to log narrative events with transaction safety
   * @param {string} userId - User making the choice
   * @param {number} chapterId - Current chapter being played
   * @param {object} choiceData - Choice details
   */
  async logNarrativeEvent(userId, chapterId, choiceData) {
    // This ensures every narrative event is immutably recorded
    await executeTransactional(async (client) => {
      await client.query(
        `INSERT INTO narrative_events (user_id, event_type, payload, occurred_at) 
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'PLAYER_MADE_CHOICE', JSON.stringify({
          chapter: chapterId,
          choiceText: choiceData?.text || choiceData?.choice?.text || 'N/A'
        })]
      );
    });
  },
  
  /**
   * Process a governance vote with event sourcing
   * @param {string} userId - User voting
   * @param {string} proposalId - Governance proposal ID
   * @param {number} optionId - Selected option
   */
  async logGovernanceVote(userId, proposalId, optionId) {
    await executeTransactional(async (client) => {
      // Record governance event
      await client.query(
        `INSERT INTO narrative_events (user_id, event_type, payload, occurred_at) 
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'DAO_VOTE_CAST', JSON.stringify({
          proposal: proposalId,
          option: optionId
        })]
      );
      
      // Also record in governance_votes table (existing functionality)
      await client.query(
        `INSERT INTO governance_votes (proposal_id, user_id, option_id)
         VALUES ($1, $2, $3)`,
        [proposalId, userId, optionId]
      );
    });
  }
};

module.exports = narrativeData;

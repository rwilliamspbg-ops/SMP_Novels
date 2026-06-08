/**
 * Character Memory Service - RAG (Retrieval Augmented Generation) Implementation
 * 
 * This module implements contextual memory retrieval for AI characters (Elias, Priya, Thorne).
 * Uses simulated vector lookup to retrieve contextually relevant past interactions.
 */

const pool = require('../src/database_utils').pool;

/**
 * Memory record structure for a character interaction
 */
class MemoryRecord {
  constructor(id, characterId, timestamp, topic, content, sentiment, confidence) {
    this.id = id;
    this.characterId = characterId; // 'elias', 'priya', 'thorne'
    this.timestamp = timestamp;
    this.topic = topic; // e.g., 'protocol_failure', 'arbitration', 'data_breach'
    this.content = content;
    this.sentiment = sentiment; // positive, negative, neutral
    this.confidence = confidence; // 0-1
  }

  static fromRow(row) {
    return new MemoryRecord(
      row.id,
      row.character_id,
      row.timestamp,
      row.topic,
      row.content,
      row.sentiment,
      parseFloat(row.confidence || 0)
    );
  }
}

/**
 * Simulates fetching contextually relevant memories for an AI character 
 * based on the current prompt, mimicking RAG lookup.
 * 
 * In production, this would call pgvector/Pinecone/etc.
 * For now, we simulate retrieval based on keywords in the prompt.
 * 
 * @param {string} characterName - Elias, Priya, or Thorne
 * @param {string} userPromptContext - The immediate text surrounding the query
 * @returns {Promise<Array>} An array of context snippets to ground the LLM response
 */
async function retrieveCharacterContext(characterName, userPromptContext) {
  console.log(`[MemoryService] Querying ${characterName}'s memory for context...`);

  let relevantSnippets = [];
  const lowerContext = (userPromptContext || '').toLowerCase();
  
  // Character-specific memory triggers
  const characterProfiles = {
    'elias': {
      interests: ['protocol', 'failure', 'security', 'architecture', 'consensus'],
      memories: [
        "Elias previously expressed extreme distrust of unverified external protocols.",
        "He once stated, 'Trust is a resource we must budget for.'",
        "Elias noted that Byzantine failures are more dangerous than simple bugs.",
        "He believes in defensive architecture and zero-trust principles."
      ]
    },
    'priya': {
      interests: ['legal', 'arbitration', 'compliance', 'ethics', 'governance'],
      memories: [
        "Priya consistently cites Section 4.B of the Geneva Accords regarding arbitration.",
        "She emphasized that 'The law is our shield, not just a constraint.'",
        "Priya believes transparency must be balanced with operational security."
      ]
    },
    'thorne': {
      interests: ['quantum', 'simulation', 'physics', 'optimization', 'efficiency'],
      memories: [
        "Thorne often warns about quantum decoherence risks in distributed systems.",
        "He stated, 'Efficiency without resilience is a recipe for collapse.'",
        "Thorne's simulations show that 99.9% uptime is not enough for mission-critical systems."
      ]
    }
  };

  const profile = characterProfiles[characterName.toLowerCase()];
  
  if (!profile) {
    console.log(`[MemoryService] No profile found for character: ${characterName}`);
    return [];
  }

  // Simulate keyword-based retrieval (would be vector search in production)
  const matchingSnippets = profile.memories.filter(memory => {
    const keywords = memory.toLowerCase().split(' ').filter(w => w.length > 3);
    const matches = keywords.filter(kw => lowerContext.includes(kw));
    return matches.length > 0; // Return memories that match at least one keyword
  });

  if (matchingSnippets.length > 0) {
    console.log(`[MemoryService] Retrieved ${matchingSnippets.length} relevant memories for ${characterName}`);
    matchingSnippets.forEach((snippet, i) => {
      console.log(`  [${i + 1}] ${snippet}`);
    });
  } else {
    console.log(`[MemoryService] No specific memories matched for ${characterName}. Using general persona.`);
    relevantSnippets = [`Character ${characterName} maintains their core personality and established behaviors.`];
  }

  return relevantSnippets;
}

/**
 * Simulates storing a new memory interaction (for future retrieval)
 * @param {string} characterName - Character who experienced the event
 * @param {object} eventData - Event data to store
 */
async function storeMemory(characterName, eventData) {
  try {
    const client = await pool.connect();
    
    // In production, this would insert into a memory table with vector embeddings
    // For now, we log and simulate storage
    
    console.log(`[MemoryService] Storing memory for ${characterName}:`);
    console.log(`  Topic: ${eventData.topic || 'general'}`);
    console.log(`  Content: ${eventData.content.substring(0, 100)}...`);

    await client.release();
    
    // Return success confirmation
    return {
      success: true,
      character: characterName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error storing memory:', error.message);
    throw new Error(`Memory storage failed: ${error.message}`);
  }
}

/**
 * Get character affinity scores based on interactions
 * @param {string} characterName - Character to query
 * @returns {Promise<object>} Affinity scores and metadata
 */
async function getCharacterAffinity(characterName) {
  try {
    // In production, this would aggregate from database or vector store
    // Returning simulated data for now
    
    const baseAffinity = {
      elias: { score: 50, label: 'Neutral', description: 'Maintaining professional distance' },
      priya: { score: 60, label: 'Trustful', description: 'Respectful collaboration established' },
      thorne: { score: 45, label: 'Cautious', description: 'Observing from distance' }
    };

    return baseAffinity[characterName.toLowerCase()] || { 
      score: 50, 
      label: 'Unknown',
      description: 'No interaction history'
    };
  } catch (error) {
    console.error('Error getting affinity:', error.message);
    throw new Error(`Affinity query failed: ${error.message}`);
  }
}

module.exports = {
  MemoryRecord,
  retrieveCharacterContext,
  storeMemory,
  getCharacterAffinity
};

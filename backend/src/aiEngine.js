const stateManager = require('./stateManager');

class RAGEngine {
    constructor() {
        // Initialize only if keys are present to prevent crash on startup
        this.pc = null;
        this.openai = null;
        this.index = null;

        if (process.env.PINECONE_API_KEY && process.env.OPENAI_API_KEY) {
            try {
                const { Pinecone } = require('@pinecone-database/pinecone');
                const { OpenAI } = require('openai');
                
                this.pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
                this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                this.index = this.pc.index('novel-lore');
                console.log('RAG Engine: Connected to Pinecone and OpenAI');
            } catch (e) {
                console.error('RAG Engine: Initialization failed', e);
            }
        } else {
            console.log('RAG Engine: Running in Mock Mode (No API keys found)');
        }
    }

    async getEmbedding(text) {
        if (!this.openai) return new Array(1536).fill(0); 
        const response = await this.openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text
        });
        return response.data[0].embedding;
    }

    async retrieveLore(query) {
        if (!this.index) return "The Aegis Core is a massive, humming machine of memory and light. Elias Vance is the architect.";
        
        try {
            const queryEmbedding = await this.getEmbedding(query);
            const results = await this.index.query({
                vector: queryEmbedding,
                topK: 3,
                includeMetadata: true
            });
            return results.matches.map(m => m.metadata.text).join('\n\n');
        } catch (e) {
            return "Technical lore unavailable.";
        }
    }

    async generateRAGResponse(character, userId, context) {
        if (!this.openai) return this.getAIResponse(character, userId, context);

        const state = stateManager.getUserState(userId);
        const lore = await this.retrieveLore(context);
        
        const systemPrompt = `You are ${character}, a character in the technical novel The Cognoscent Echo. 
        Use the following world lore to respond accurately:
        ---
        ${lore}
        ---
        Current User Relationship: ${state.characterRelationships[character] || 50}.
        Maintain your technical persona. Be concise and immersive.`;

        const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: context }
            ]
        });

        return response.choices[0].message.content;
    }

    async getAIResponse(character, userId, context) {
        // This is the fallback a user will see unless API keys are provided in .env
        const mockResponses = {
            elias: {
                success: `(Eyes widening) "The throughput just jumped. You actually did it. I... I didn't think that allocation pattern would hold."`,
                failure: `(Sighs) "The leak is still there. We are running out of time, and you are wasting cycles."`
            },
            priya: {
                success: `(Leaning in) "Interesting. You've bypassed the bottleneck. Is this a permanent fix or just a temporary patch?"`,
                failure: `(Notes on tablet) "Another failed attempt. I'm beginning to wonder if the architecture is fundamentally flawed."`
            }
        };

        const result = context.includes('success') ? mockResponses[character]?.success : mockResponses[character]?.failure;
        return result || `[RAG System] ${character} acknowledges your action.`;
    }
}

module.exports = new RAGEngine();

const stateManager = require('./stateManager');
const fs = require('fs');
const path = require('path');

class RAGEngine {
    constructor() {
        // Initialize only if keys are present to prevent crash on startup
        this.pc = null;
        this.openai = null;
        this.index = null;
        this.novelMemoryPromise = this.loadNovelMemory();

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

    async loadNovelMemory() {
        try {
            const pdfPath = path.resolve(__dirname, '..', '..', 'THE_COGNOSCENT_ECHO.pdf');
            const pdfBuffer = await fs.promises.readFile(pdfPath);
            const pdfModule = await import('pdf-parse');
            const pdfParse = pdfModule.default || pdfModule;
            const parsed = await pdfParse(pdfBuffer);
            const normalizedText = (parsed.text || '')
                .replace(/\r\n/g, '\n')
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            return {
                title: 'THE COGNOSCENT ECHO',
                outline: this.extractOutline(normalizedText),
                openingExcerpt: normalizedText.slice(0, 5000),
                fullText: normalizedText,
            };
        } catch (e) {
            console.error('RAG Engine: PDF memory load failed', e.message);
            return {
                title: 'THE COGNOSCENT ECHO',
                outline: [],
                openingExcerpt: '',
                fullText: '',
            };
        }
    }

    extractOutline(text) {
        if (!text) return [];

        const outline = [];
        const lines = text.split('\n');
        let capture = false;

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            if (!capture && /^Contents$/i.test(line)) {
                capture = true;
                continue;
            }

            if (capture) {
                if (/^PART\s+[IVX]+:/i.test(line) || /^Prologue:/i.test(line) || /^Epilogue:/i.test(line) || /^\d+\s+/.test(line)) {
                    outline.push(line);
                }

                if (outline.length >= 24) break;
            }
        }

        return outline;
    }

    async getNovelMemory() {
        return this.novelMemoryPromise;
    }

    async buildStoryReference(query) {
        const memory = await this.getNovelMemory();

        if (!memory || (!memory.openingExcerpt && memory.outline.length === 0)) {
            return 'Story reference unavailable.';
        }

        const outlineText = memory.outline.length
            ? memory.outline.map(item => `- ${item}`).join('\n')
            : '- Outline unavailable';
        const excerpt = this.findRelevantExcerpt(memory.fullText, query) || memory.openingExcerpt;

        return [
            `Novel: ${memory.title}`,
            'Story spine:',
            outlineText,
            'Reference excerpt:',
            excerpt.slice(0, 3500),
        ].join('\n\n');
    }

    findRelevantExcerpt(text, query) {
        if (!text || !query) return '';

        const words = query
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(word => word.length > 3);

        for (const word of words) {
            const index = text.toLowerCase().indexOf(word);
            if (index !== -1) {
                const start = Math.max(0, index - 500);
                const end = Math.min(text.length, index + 1400);
                return text.slice(start, end).trim();
            }
        }

        return '';
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
        const storyReference = await this.buildStoryReference(context);
        
        const systemPrompt = `You are ${character}, a character in the technical novel The Cognoscent Echo. 
        Use the following world lore to respond accurately:
        ---
        ${lore}
        ---
        Use the following story reference from the full novel manuscript as canon context:
        ---
        ${storyReference}
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
        if (this.openai) {
            return this.generateRAGResponse(character, userId, context);
        }

        const storyReference = await this.buildStoryReference(context);

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
        return result || `[RAG System] ${character} acknowledges your action. Story reference: ${storyReference.slice(0, 220)}`;
    }
}

module.exports = new RAGEngine();

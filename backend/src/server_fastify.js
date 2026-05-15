const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const sagaEngine = require('./sagaEngine_pg');
const narrativeData = require('./narrativeData');
const aiEngine = require('./aiEngine');
const aiRouter = require('./aiRouter');
const govStore = require('./governanceStore_redis');

fastify.register(cors, { origin: '*', methods: '*' });

fastify.get('/progress/:userId', async (request, reply) => {
    return await sagaEngine.getReaderProgress(request.params.userId);
});

fastify.post('/choice', async (request, reply) => {
    const { userId, chapterId, choiceIndex } = request.body;
    try {
        const progress = await sagaEngine.makeChoice(userId, chapterId, choiceIndex);
        return { success: true, progress };
    } catch (e) {
        reply.status(400).send({ error: e.message });
    }
});

fastify.get('/chapter/:id', async (request, reply) => {
    const chapter = narrativeData.chapters[request.params.id];
    if (!chapter) return reply.status(404).send({ error: 'Chapter not found' });
    return chapter;
});

fastify.post('/ai-response', async (request, reply) => {
    const { character, context, userId } = request.body;
    const memory = await sagaEngine.getReaderProgress(userId); 
    const routedResponse = await aiRouter.routeRequest(character, context, userId, memory);
    return routedResponse;
});

fastify.get('/governance/tally/:proposalId', async (request, reply) => {
    return await govStore.getTally(request.params.proposalId);
});

fastify.post('/governance/vote', async (request, reply) => {
    const { proposalId, optionId, userId } = request.body;
    try {
        const tally = await govStore.recordVote(proposalId, optionId, userId);
        return { success: true, currentTally: tally };
    } catch (e) {
        reply.status(400).send({ error: e.message });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('🚀 Cognoscent Echo Production API running on port 3001');
    } catch (err) {
        process.exit(1);
    }
};

start();

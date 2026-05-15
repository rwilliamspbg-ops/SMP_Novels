fastify.post('/ai-response', async (request, reply) => {
    const { character, context, userId } = request.body;
    try {
        const response = await aiEngine.getAIResponse(character, userId, context);
        return response;
    } catch (e) {
        reply.status(500).send({ error: 'AI Engine failure' });
    }
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');

class BillingService {
    async createCheckoutSession(userId, priceId) {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            client_reference_id: userId,
        });
        return session.url;
    }

    async handleWebhook(event) {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.client_reference_id;
            // Upgrade user to premium in MongoDB
            await require('./models').User.findByIdAndUpdate(userId, { tier: 'premium' });
        }
    }
}

module.exports = new BillingService();

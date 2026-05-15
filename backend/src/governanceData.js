const governanceState = {
    proposals: {
        'G-2029-088': {
            title: 'The Dissent Registry Act',
            description: 'Shall the private keys of the dissenters be publicized to ensure total transparency, or purged to protect the minority?',
            options: [
                { id: 'publicize', label: 'Publicize (Corporate Path)', weight: 0 },
                { id: 'purge', label: 'Purge (Sovereign Path)', weight: 1 }
            ],
            votes: { publicize: 0, purge: 0 },
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    }
};

module.exports = governanceState;

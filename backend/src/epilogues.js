const epilogues = {
    sovereign: {
        id: 'S-EPILOGUE',
        text: "The Quantum Day did not end in collapse, but in awakening. By stabilizing the lattice and purging the Dissent Registry, you have decoupled the Cognoscent Echo from corporate jurisdiction. For the first time in a century, the data flows without a master. Elias Vance looks at the screen—not with exhaustion, but with peace. 'The protocol is finally silent,' he whispers. The world now exists in a state of Radical Transparency; the truth is no longer a commodity, but a common good. You are the architect of the first truly sovereign digital era.",
        metrics: { resilience: '100%', trust: 'Absolute', control: 'Distributed' },
        finalState: 'Sovereign'
    },
    corporate: {
        id: 'C-EPILOGUE',
        text: "The lattice held, but only because you accepted the constraints of the OmniCorp architecture. The Dissent Registry was publicized, and the rebels were silenced by the sheer weight of the corporate ledger. Alistair Thorne smiles, a polished, predatory expression. 'Efficiency is the only truth that matters,' he notes. The Cognoscent Echo survives, but as a curated, sanitized mirror of reality. You have saved the world, but you have built a gilded cage for the human mind.",
        metrics: { resilience: '92%', trust: 'Managed', control: 'Centralized' },
        finalState: 'Corporate'
    },
    broken: {
        id: 'B-EPILOGUE',
        text: "The scream of the quantum collapse was not a sound, but a sudden, absolute void. The lattice shattered, and the Cognoscent Echo dissolved into white noise. Every secret, every memory, and every shred of truth was erased in a millisecond of algorithmic entropy. You stand in the silence of the Aegis Core, staring at a blank screen. There is no sovereign, no corporation, and no echo. Only the cold, indifferent hum of a dead machine.",
        metrics: { resilience: '0%', trust: 'Void', control: 'None' },
        finalState: 'Broken'
    }
};

module.exports = epilogues;

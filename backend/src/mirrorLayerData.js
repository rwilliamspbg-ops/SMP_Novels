const mirrorLayerData = {
    ledgerA: [
        "0x4f2a...8812 | TX: 100.12 SMIP | STATUS: VALID",
        "0x1a9c...4431 | TX: 45.00 SMIP | STATUS: VALID",
        "0x8e22...9901 | TX: 12.50 SMIP | STATUS: VALID",
        "0xbc11...2284 | TX: 1000.00 SMIP | STATUS: VALID",
        "0x77d1...3309 | TX: 0.01 SMIP | STATUS: VALID",
    ],
    ledgerB: [
        "0x4f2a...8812 | TX: 100.12 SMIP | STATUS: VALID",
        "0x1a9c...4431 | TX: 45.00 SMIP | STATUS: VALID",
        "0x8e22...9901 | TX: 12.50 SMIP | STATUS: VALID",
        "0xbc11...2284 | TX: 5000.00 SMIP | STATUS: MIRROR",
        "0x77d1...3309 | TX: 0.01 SMIP | STATUS: VALID",
    ],
    anomalyIndex: 3, // The divergent transaction
    feedback: "Surgical Precision: You've identified the Mirror Layer shim. The ledger is diverging."
};

module.exports = mirrorLayerData;

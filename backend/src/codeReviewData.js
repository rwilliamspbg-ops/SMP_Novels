const codeReviewData = {
    commitId: "v_dev_8821",
    author: "velocity_dev",
    diff: [
        { line: 12, code: "func VerifyPQC() {", type: "neutral" },
        { line: 13, code: "    // TODO: Implement lattice check", type: "neutral" },
        { line: 14, code: "    go func() { defer checkLattice() }()", type: "malicious", feedback: "Vulnerability: PQC check deferred to background thread; bypasses synchronous lock." },
        { line: 15, code: "    return true", type: "neutral" },
    ],
    correctAction: "reject",
    feedback: "Excellent audit. You blocked the PQC bypass attempt. The system integrity is preserved."
};

module.exports = codeReviewData;

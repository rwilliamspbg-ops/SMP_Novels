// Extend renderInteractiveElement in interactiveElements.js to support new tools
if (element.type === 'governance_vote') {
    renderGovernanceModule(element);
} else if (element.type === 'forensic_tool') {
    renderForensicTool(element);
} else if (element.type === 'code_review') {
    renderCodeReview(element);
} else if (element.type === 'quantum_sim') {
    renderQuantumSimulator(element);
}

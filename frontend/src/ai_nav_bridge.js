// Update interactiveElements.js to respond to AI-driven events
window.addEventListener('trigger-tool', (e) => {
    const toolType = e.detail;
    console.log(`AI requested tool: ${toolType}`);
    
    const elementMap = {
        'code_snippet': () => renderCodePlayground(), 
        'governance_vote': () => renderGovernanceModule(),
        'forensic_tool': () => renderForensicTool(),
        'code_review': () => renderCodeReview(),
        'quantum_sim': () => renderQuantumSimulator()
    };

    if (elementMap[toolType]) {
        elementMap[toolType]();
    } else {
        console.error('AI requested an unknown tool type');
    }
});

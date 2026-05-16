// Provide placeholder renderers for extended interactive elements.
function renderGovernanceModule(element) {
    const div = document.createElement('div');
    div.className = 'gov-module';
    div.innerHTML = `<h3 style='color:#00ffcc'>Governance Module</h3><p>${element.description||''}</p>`;
    document.getElementById('interactive-zone').appendChild(div);
}

function renderCodeReview(element) {
    const div = document.createElement('div');
    div.className = 'code-review';
    div.innerHTML = `<h3 style='color:#00ffcc'>Code Review</h3><p>${element.description||''}</p>`;
    document.getElementById('interactive-zone').appendChild(div);
}

function renderQuantumSimulator(element) {
    const div = document.createElement('div');
    div.className = 'quantum-sim';
    div.innerHTML = `<h3 style='color:#00ffcc'>Quantum Simulator</h3><p>${element.description||''}</p>`;
    document.getElementById('interactive-zone').appendChild(div);
}

// Expose to window
window.renderGovernanceModule = window.renderGovernanceModule || renderGovernanceModule;
window.renderCodeReview = window.renderCodeReview || renderCodeReview;
window.renderQuantumSimulator = window.renderQuantumSimulator || renderQuantumSimulator;

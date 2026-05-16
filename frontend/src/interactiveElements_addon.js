// Provide a placeholder renderer for forensic tools used by chapters.
function renderForensicTool(element) {
    const div = document.createElement('div');
    div.className = 'forensic-tool';
    div.innerHTML = `
        <h3 style='color:#00ffcc'>Forensic Tool</h3>
        <p>${element.description || 'Analyze mirror-layer shims and diffs.'}</p>
        <pre class='forensics-output'>${element.initialCode || ''}</pre>
    `;
    document.getElementById('interactive-zone').appendChild(div);
}

// Expose to window so other scripts can call it if needed
window.renderForensicTool = window.renderForensicTool || renderForensicTool;

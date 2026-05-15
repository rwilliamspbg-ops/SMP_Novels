function renderCodeReview(element) {
    const div = document.createElement('div');
    div.className = 'code-review-panel';
    div.innerHTML = `
        <h3 style='color:#00ffcc'>PR Review: velocity_dev @ Commit ${element.commitId}</h3>
        <div class='diff-container' style='background:#0d1117; border:1px solid #30363d; padding:10px; font-family:monospace; color:#cdd6f4;'>
            ${element.diff.map((line, i) => `
                <div class='diff-line' data-index='${i}' style='cursor:pointer; padding:2px 0;'>
                    <span style='color:#8b949e; width:30px; display:inline-block;'>${line.line}</span>
                    <span class='code-text'>${line.code}</span>
                </div>
            `).join('')}
        </div>
        <div id='review-feedback' style='margin-top:10px; color:#fff;'></div>
        <div style='display:flex; gap:10px; margin-top:20px;'>
            <button class='review-btn' data-action='approve' style='background:#238636; color:#fff;'>Approve</button>
            <button class='review-btn' data-action='reject' style='background:#da3636; color:#fff;'>Reject</button>
        </div>
    `;
    document.getElementById('interactive-zone').appendChild(div);

    const lines = div.querySelectorAll('.diff-line');
    lines.forEach(line => {
        line.onclick = () => {
            lines.forEach(l => l.style.background = 'transparent');
            line.style.background = '#21262d';
            // Logic for highlighting "malicious" lines could be added here as a hint
        };
    });

    div.querySelectorAll('.review-btn').forEach(btn => {
        btn.onclick = async () => {
            const action = btn.dataset.action;
            const feedbackDiv = div.querySelector('#review-feedback');
            
            if (action === element.correctAction) {
                feedbackDiv.innerHTML = `<span style='color:#0f0'>${element.feedback}</span>`;
                await window.CognoscentBridge.bridgeChoice(14, 1); // Advance narrative
            } else {
                feedbackDiv.innerHTML = `<span style='color:red'>Critical Error: You approved a malicious bypass. The system is now compromised.</span>`;
                await window.CognoscentBridge.bridgeChoice(14, 0); // Branch to "Compromised" ending
            }
        };
    });
}

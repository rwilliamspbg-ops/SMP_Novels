function renderGovernanceModule(proposal) {
    const div = document.createElement('div');
    div.className = 'gov-module';
    div.style.background = '#161b22';
    div.style.border = '2px solid #3fb950';
    div.style.borderRadius = '12px';
    div.style.padding = '24px';
    div.style.margin = '20px 0';
    div.style.fontFamily = '"EB Garamond", serif';

    div.innerHTML = `
        <h3 style='color:#f0f6fc; font-size:24px;'>${proposal.title}</h3>
        <p style='color:#8b949e; font-size:14px;'>${proposal.description}</p>
        <div class='vote-options' style='display:flex; gap:10px; margin-top:20px;'>
            ${proposal.options.map(opt => `<button class='gov-btn' data-id='${opt.id}' style='background:#21262d; color:#f0f6fc; border:1px solid #30363d; padding:8px 16px; border-radius:6px; cursor:pointer;'>${opt.label}</button>`).join('')}
        </div>
        <div id='gov-tally' style='margin-top:20px; color:#3fb950; font-family:monospace;'></div>
    `;
    document.getElementById('interactive-zone').appendChild(div);

    div.querySelectorAll('.gov-btn').forEach(btn => {
        btn.onclick = async () => {
            const optionId = btn.dataset.id;
            const response = await fetch('http://localhost:3001/governance/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    proposalId: 'G-2029-088', 
                    optionId: optionId, 
                    userId: window.CognoscentBridge.userId 
                })
            });
            const data = await response.json();
            div.querySelector('#gov-tally').innerText = `Current Tally: ${JSON.stringify(data.currentTally)}`;
            btn.disabled = true;
        };
    });
}

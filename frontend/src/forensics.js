function renderForensicTool(element) {
    const div = document.createElement('div');
    div.className = 'forensic-tool';
    div.innerHTML = `
        <h3 style='color:#00ffcc'>Mirror Layer Forensic Tool: Trace the Shim</h3>
        <p>Compare the two ledger streams. Identify the Divergent Transaction.</p>
        <div style='display:flex; gap:20px; font-family:monospace;'>
            <div id='ledger-a' style='flex:1; background:#000; color:#0f0; padding:10px; border:1px solid #333;'>
                <strong>Sovereign Ledger</strong><hr>
                ${element.ledgerA.map((line, i) => `<div class='ledger-line' data-index='${i}'>${line}</div>`).join('')}
            </div>
            <div id='ledger-b' style='flex:1; background:#000; color:#0f0; padding:10px; border:1px solid #333;'>
                <strong>Mirror Ledger</strong><hr>
                ${element.ledgerB.map((line, i) => `<div class='ledger-line' data-index='${i}'>${line}</div>`).join('')}
            </div>
        </div>
        <div id='forensic-output' style='margin-top:20px; color:#fff;'></div>
    `;
    document.getElementById('interactive-zone').appendChild(div);

    const linesA = div.querySelectorAll('#ledger-a .ledger-line');
    const linesB = div.querySelectorAll('#ledger-b .ledger-line');

    let selectedIndex = -1;

    linesA.forEach((line, i) => {
        line.onclick = () => {
            linesA.forEach(l => l.style.background = 'transparent');
            line.style.background = '#333';
            selectedIndex = i;
        };
    });

    linesB.forEach((line, i) => {
        line.onclick = () => {
            linesB.forEach(l => l.style.background = 'transparent');
            line.style.background = '#333';
            selectedIndex = i;
        };
    });

    const btn = document.createElement('button');
    btn.innerText = 'Analyze Divergence';
    btn.style.marginTop = '20px';
    btn.onclick = async () => {
        const output = div.querySelector('#forensic-output');
        if (selectedIndex === element.anomalyIndex) {
            output.innerHTML = `<span style='color:#0f0'>${element.feedback}</span>`;
            await window.CognoscentBridge.bridgeChoice(12, 1); // Advance narrative to "Truth Revealed"
        } else {
            output.innerHTML = `<span style='color:red'>No divergence found at this index. The shim is hiding deeper.</span>`;
        }
    };
    div.appendChild(btn);
}

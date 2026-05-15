function renderInteractiveElement(element) {
    if (element.type === 'code_snippet') {
        const div = document.createElement('div');
        div.className = 'code-playground';
        div.innerHTML = `
            <h3 style='color:#00ffcc'>${element.description}</h3>
            <div id='monaco-container' class='monaco-editor-container'></div>
            <button class='run-btn'>Execute WASM Logic</button>
            <div id='code-output'></div>
        `;
        document.getElementById('interactive-zone').appendChild(div);

        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function() {
            const editor = monaco.editor.create(document.getElementById('monaco-container'), {
                value: element.initialCode,
                language: 'go',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false }
            });

            div.querySelector('.run-btn').onclick = async () => {
                const code = editor.getValue();
                const outputDiv = div.querySelector('#code-output');
                outputDiv.innerHTML = 'Compiling to WASM...';

                // Validation Logic as per Build Plan (Surgical check for sync.Pool and zero-copy)
                const hasSyncPool = code.includes('sync.Pool');
                const hasZeroCopy = code.includes('make([]byte') && !code.includes('copy(');

                setTimeout(async () => {
                    if (hasSyncPool && hasZeroCopy) {
                        outputDiv.innerHTML = `<div class='output'>[WASM SUCCESS] Binary checksum valid. Zero-copy pattern matches AF_XDP requirements.</div>`;
                        await window.CognoscentBridge.bridgeChoice(1, 1); // Advance narrative
                    } else {
                        outputDiv.innerHTML = `<div class='output' style='color:red'>[WASM ERROR] Runtime panic: Memory leak detected in FramePool.</div>`;
                    }
                }, 1000);
            };
        });
    } else if (element.type === 'governance_vote') {
        const div = document.createElement('div');
        div.className = 'gov-vote-panel';
        div.innerHTML = `
            <h3 style='color:#00ffcc'>Governance Proposal: ${element.proposalId}</h3>
            <p>${element.description}</p>
            <div class='vote-options'>
                ${element.options.map((opt, i) => `<button class='vote-btn' data-index='${i}'>${opt.text}</button>`).join('')}
            </div>
            <div id='vote-result'></div>
        `;
        document.getElementById('interactive-zone').appendChild(div);

        div.querySelectorAll('.vote-btn').forEach(btn => {
            btn.onclick = async () => {
                const index = btn.dataset.index;
                const result = await window.CognoscentBridge.bridgeChoice(2, index);
                div.querySelector('#vote-result').innerHTML = `<div class='output'>Vote Recorded. The network is adjusting...</div>`;
                btn.disabled = true;
            };
        });
    }
}

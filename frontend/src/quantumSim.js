function renderQuantumSimulator(element) {
    const div = document.createElement('div');
    div.className = 'quantum-sim';
    div.style.background = '#000';
    div.style.border = '1px solid #00ffcc';
    div.style.borderRadius = '8px';
    div.style.padding = '20px';
    div.style.fontFamily = 'JetBrains Mono, monospace';
    div.style.position = 'relative';
    div.style.overflow = 'hidden';

    div.innerHTML = `
        <h3 style='color:#00ffcc'>QUANTUM STRESS TEST: Lattice Resilience</h3>
        <div id='sim-canvas' style='height:200px; background:#050505; margin:20px 0; border:1px solid #111; position:relative;'>
            <div id='wave-form' style='position:absolute; top:50%; left:0; width:100%; height:2px; background:#00ffcc; box-shadow: 0 0 10px #00ffcc;'></div>
        </div>
        <div style='display:flex; justify-content:space-between; align-items:center;'>
            <div>
                <label style='color:#8b949e'>Lattice Parameter (q): </label>
                <input type='range' id='q-slider' min='100' max='1000' value='500' style='vertical-align:middle;'>
                <span id='q-value' style='color:#00ffcc; margin-left:10px;'>500</span>
            </div>
            <button id='verify-btn' style='background:#00ffcc; color:#000; border:none; padding:10px 20px; font-weight:bold; cursor:pointer;'>VERIFY RESILIENCE</button>
        </div>
        <div id='sim-output' style='margin-top:20px; font-size:12px;'></div>
    `;
    document.getElementById('interactive-zone').appendChild(div);

    const slider = div.querySelector('#q-slider');
    const valDisp = div.querySelector('#q-value');
    const wave = div.querySelector('#wave-form');

    slider.oninput = () => {
        valDisp.innerText = slider.value;
        // Visual effect: wave stability depends on q
        const stability = (slider.value - 400) / 200; 
        wave.style.height = `${2 + Math.abs(stability * 10)}px`;
        wave.style.opacity = 0.5 + (stability * 0.5);
    };

    div.querySelector('#verify-btn').onclick = async () => {
        const q = parseInt(slider.value);
        const output = div.querySelector('#sim-output');
        output.innerHTML = 'Simulating Quantum Attack...';

        setTimeout(async () => {
            if (q >= 750) {
                output.innerHTML = `<span style='color:#0f0'>[SUCCESS] Lattice resilience verified. Quantum Day averted.</span>`;
                await window.CognoscentBridge.bridgeChoice(36, 1); // Sovereign Ending
            } else if (q >= 400) {
                output.innerHTML = `<span style='color:yellow'>[PARTIAL] System held, but entropy increased.</span>`;
                await window.CognoscentBridge.bridgeChoice(36, 0); // Corporate Ending
            } else {
                output.innerHTML = `<span style='color:red'>[CRITICAL] Lattice collapsed. Trust broken.</span>`;
                await window.CognoscentBridge.bridgeChoice(36, -1); // Broken Ending
            }
        }, 1500);
    };
}

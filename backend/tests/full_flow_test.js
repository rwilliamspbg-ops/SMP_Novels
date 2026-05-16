const fetch = global.fetch || require('node-fetch');

const API = 'http://127.0.0.1:3001';

async function getChapter(id) {
  const r = await fetch(`${API}/chapter/${id}`);
  if (!r.ok) throw new Error(`Failed to fetch chapter ${id}: ${r.status}`);
  return await r.json();
}

async function postChoice(userId, chapterId, choiceIndex) {
  const r = await fetch(`${API}/choice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, chapterId, choiceIndex })
  });
  return await r.json();
}

async function getProgress(userId) {
  const r = await fetch(`${API}/progress/${userId}`);
  if (!r.ok) throw new Error(`Failed to get progress for ${userId}`);
  return await r.json();
}

async function postAi(character, context, userId) {
  const r = await fetch(`${API}/ai-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character, context, userId })
  });
  if (!r.ok) throw new Error('AI request failed: ' + r.status);
  return await r.json();
}

async function recordVote(proposalId, optionId, userId) {
  const r = await fetch(`${API}/governance/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposalId, optionId, userId })
  });
  return await r.json();
}

async function walkPaths() {
  const userId = 'e2e-' + Math.random().toString(36).slice(2, 9);
  const visitedPaths = [];

  async function dfs(chapterId, path) {
    const chapter = await getChapter(chapterId);
    path.push(chapterId);

    // exercise ai if any
    try {
      const aiResp = await postAi('elias', 'success', userId);
      console.log('AI routed using', aiResp.modelUsed || aiResp.model);
    } catch (e) {
      console.warn('AI call failed (non-fatal):', e.message);
    }

    // exercise governance if present
    if (chapter.interactiveElement && chapter.interactiveElement.type === 'governance_vote') {
      const pid = chapter.interactiveElement.proposalId || 'G-TEST';
      try {
        await recordVote(pid, 'option0', userId);
      } catch (e) {
        console.warn('Vote failed (may be duplicate):', e.message || e);
      }
    }

    if (!chapter.choices || chapter.choices.length === 0) {
      visitedPaths.push([...path]);
      path.pop();
      return;
    }

    for (let i = 0; i < chapter.choices.length; i++) {
      const next = chapter.choices[i].nextChapter;
      // make the choice
      const resp = await postChoice(userId, chapterId, i);
      if (resp && resp.success === false && resp.error) {
        throw new Error('Choice failed: ' + resp.error);
      }
      const progress = await getProgress(userId);
      if (progress.current_chapter !== next && progress.currentChapter !== next) {
        throw new Error(`Progress mismatch after choice: expected ${next} got ${JSON.stringify(progress)}`);
      }
      await dfs(next, path);
    }

    path.pop();
  }

  await dfs(1, []);
  return visitedPaths;
}

async function run() {
  console.log('Starting full chapter flow test...');
  try {
    const paths = await walkPaths();
    console.log('Completed paths:', paths);
    console.log('E2E full flow test: SUCCESS');
    process.exit(0);
  } catch (e) {
    console.error('E2E full flow test: FAILED', e);
    process.exit(2);
  }
}

run();

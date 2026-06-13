# SMP_Novels - Copilot & NavigatorPlayer Integration Guide

## Overview

This document outlines the comprehensive fixes applied to integrate **CopilotKit** (AI co-pilot) and **NavigatorPlayer** (story navigation engine) for a fully interactive narrative experience.

## Architecture Improvements

### 1. NavigatorPlayer.js (Core Story Engine)
**Location:** `frontend/src/NavigatorPlayer.js`

The new NavigatorPlayer class is the central hub for story management:

#### Key Features:
- **Chapter Management**: Load chapters, maintain history, manage navigation flow
- **State Management**: Track current chapter, choices, unlocked nodes, metrics
- **Event System**: Emit events for chapter loads, choices, interactive tools
- **AI Integration**: Listen for AI-driven narrative advancement and tool triggers
- **Metrics Tracking**: Real-time throughput, latency, resilience, and energy metrics

#### Public API:
```javascript
// Load a chapter
await navigatorPlayer.loadChapter(chapterId);

// Make a choice and advance story
await navigatorPlayer.makeChoice(choiceIndex);

// Trigger interactive tools
await navigatorPlayer.triggerInteractiveTool('code_snippet');

// Register event listeners
navigatorPlayer.on('onChapterLoad', (data) => {
    // Handle chapter load
});

// Get current state
const state = navigatorPlayer.getState();

// Unlock nodes
navigatorPlayer.unlockNode('node_id');
```

#### Event Types:
- `onChapterLoad`: Fired when chapter loads with chapter data and metrics
- `onChoiceMade`: Fired when user makes a choice
- `onInteractiveTriggered`: Fired when interactive tool is triggered
- `onNavigationUpdate`: Fired when navigation state changes

### 2. CopilotAgentController.js (AI Agent Integration)
**Location:** `frontend/src/CopilotAgentController.js`

Bridges CopilotKit with the story engine via custom agent actions:

#### Registered Actions:

**1. advance_narrative**
```javascript
// AI can advance to any chapter
{
  name: 'advance_narrative',
  parameters: [{ name: 'chapterId', type: 'number' }],
  handler: async (args) => { /* loads chapter */ }
}
```

**2. trigger_interactive_tool**
```javascript
// AI can trigger interactive elements
{
  name: 'trigger_interactive_tool',
  parameters: [{ name: 'toolType', type: 'string' }],
  handler: async (args) => { /* triggers tool */ }
}
```

**3. guide_choice**
```javascript
// AI analyzes available choices and provides guidance
{
  name: 'guide_choice',
  parameters: [{ name: 'analysisDepth', type: 'string' }]
}
```

**4. analyze_narrative**
```javascript
// AI analyzes current story state
{
  name: 'analyze_narrative',
  parameters: []
}
```

### 3. AI Navigation Bridge (ai_nav_bridge.js)
**Location:** `frontend/src/ai_nav_bridge.js`

Listens for AI-driven events and routes them to the appropriate handlers:

```javascript
// AI-triggered tool activation
window.addEventListener('trigger-tool', (e) => {
    const toolType = e.detail; // 'code_snippet', 'governance_vote', etc.
    navigatorPlayer.triggerInteractiveTool(toolType);
});

// AI-triggered narrative advancement
window.addEventListener('advance-narrative', (e) => {
    const chapterId = e.detail;
    navigatorPlayer.loadChapter(chapterId);
});
```

### 4. Updated main.js Integration
**Location:** `frontend/src/main.js`

Now delegates all story logic to NavigatorPlayer:

#### Key Changes:
- Listens for NavigatorPlayer events instead of directly managing state
- Renders UI based on NavigatorPlayer data
- Delegates chapter loading and choice making to NavigatorPlayer
- Real-time metrics display from NavigatorPlayer

### 5. HTML Script Loading Order
**Location:** `frontend/index.html`

Scripts now load in dependency order:

```html
1. bridge.js            <!-- API bridge layer -->
2. NavigatorPlayer.js   <!-- Core story engine -->
3. CopilotAgentController.js  <!-- AI integration -->
4. ai_nav_bridge.js     <!-- Event routing -->
5. main.js              <!-- UI & initialization -->
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface (HTML)               │
│    ┌─────────┐  ┌──────────┐  ┌─────────────────┐     │
│    │ Choices │  │Interactive│  │ Metrics Display │     │
│    │ Buttons │  │ Elements  │  │ (TP/LAT/RES)    │     │
│    └────┬────┘  └─────┬─────┘  └────────┬────────┘     │
└─────────┼─────────────┼──────────────────┼──────────────┘
          │             │                  │
          └─────────────┴──────────────────┘
                        │
          ┌─────────────▼─────────────┐
          │    main.js (UI Layer)     │
          │ Renders & event handling  │
          └────────────┬──────────────┘
                        │
          ┌─────────────▼──────────────────────┐
          │ NavigatorPlayer (Story Engine)      │
          │ ├─ Chapter management               │
          │ ├─ Choice processing                │
          │ ├─ State management                 │
          │ ├─ Event emission                   │
          │ └─ Metrics tracking                 │
          └────────┬──────────────┬─────────────┘
                   │              │
        ┌──────────▼──┐  ┌────────▼─────────┐
        │ CopilotKit   │  │AI NavBridge      │
        │ Agent        │  │Event Router      │
        │ Actions      │  │trigger-tool      │
        └──────────────┘  │advance-narrative │
                          └──────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │ CognoscentBridge API │
                    │ (Backend)            │
                    │ ├─ fetchChapter      │
                    │ ├─ recordChoice      │
                    │ └─ getProgress       │
                    └──────────────────────┘
```

## Interactive Elements Support

The system now supports triggering any interactive element:

```javascript
// Code Snippet with Monaco Editor
navigatorPlayer.triggerInteractiveTool('code_snippet');

// Governance Voting Module
navigatorPlayer.triggerInteractiveTool('governance_vote');

// Forensic Analysis Tool
navigatorPlayer.triggerInteractiveTool('forensic_tool');

// Code Review Interface
navigatorPlayer.triggerInteractiveTool('code_review');

// Quantum Simulator
navigatorPlayer.triggerInteractiveTool('quantum_sim');
```

## AI-Driven Narrative Flow

### Example: AI Advancing Story

```javascript
// CopilotKit AI decides to advance the narrative
copilotAgentController.emitAdvanceNarrative(5);

// This triggers:
// 1. Custom event 'advance-narrative' with chapter ID
// 2. ai_nav_bridge listener captures it
// 3. NavigatorPlayer.loadChapter(5) is called
// 4. Chapter loads and UI updates via event listeners
```

### Example: AI Triggering Interactive Tool

```javascript
// CopilotKit AI decides to activate a code playground
copilotAgentController.emitTriggerTool('code_snippet');

// This triggers:
// 1. Custom event 'trigger-tool' with tool type
// 2. ai_nav_bridge listener captures it
// 3. NavigatorPlayer.triggerInteractiveTool('code_snippet') is called
// 4. Monaco editor renders in interactive zone
```

## Testing the Integration

### 1. Manual Testing

```javascript
// In browser console
navigatorPlayer.loadChapter(2);
navigatorPlayer.makeChoice(0);
navigatorPlayer.triggerInteractiveTool('code_snippet');
navigatorPlayer.unlockNode('secret_chapter');
```

### 2. Event Listener Testing

```javascript
// Monitor chapter loads
navigatorPlayer.on('onChapterLoad', (data) => {
    console.log('Chapter loaded:', data);
});

// Monitor choices
navigatorPlayer.on('onChoiceMade', (data) => {
    console.log('Choice made:', data);
});
```

### 3. AI Action Testing

```javascript
// Test AI actions
copilotAgentController.emitAdvanceNarrative(3);
copilotAgentController.emitTriggerTool('governance_vote');
```

## Deployment Checklist

- [x] NavigatorPlayer.js created and functional
- [x] CopilotAgentController.js integrated
- [x] ai_nav_bridge.js updated for event routing
- [x] main.js refactored to use NavigatorPlayer
- [x] HTML script loading order corrected
- [x] Event system fully implemented
- [x] Metrics tracking enabled
- [x] Interactive elements wired
- [x] AI action handlers registered
- [ ] CopilotKit SDK integration (optional, for production CopilotKit)
- [ ] Backend chapter data verification
- [ ] E2E testing
- [ ] Production deployment

## Future Enhancements

1. **CopilotKit SDK Integration**: Add official CopilotKit dependencies for enhanced AI capabilities
2. **Persistent State**: Add localStorage/IndexedDB for saving reader progress
3. **Analytics**: Track reader choices and engagement metrics
4. **Achievements**: Implement node unlocking and achievement system
5. **Branching Complexity**: Support more complex narrative branches
6. **Custom AI Personas**: Allow multiple AI characters with different personalities
7. **Multi-user Collaboration**: Support collaborative storytelling sessions

## Troubleshooting

### NavigatorPlayer not initializing
```javascript
// Check in console
console.log(window.navigatorPlayer);
// If undefined, check that NavigatorPlayer.js loads before main.js
```

### Events not firing
```javascript
// Verify event listeners are registered
navigatorPlayer.listeners // should show your callbacks
```

### Chapter not loading
```javascript
// Check bridge connection
window.CognoscentBridge.fetchChapter(1)
  .then(chapter => console.log('Chapter:', chapter))
  .catch(err => console.error('Error:', err));
```

### Metrics not updating
```javascript
// Check NavigatorPlayer state
console.log(navigatorPlayer.getState());
```

## API Reference

### NavigatorPlayer Methods

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `loadChapter(id)` | chapterId: number | Promise | Load chapter by ID |
| `makeChoice(index)` | choiceIndex: number | Promise | Record choice and advance |
| `triggerInteractiveTool(type)` | toolType: string | Promise<boolean> | Activate interactive element |
| `on(event, callback)` | event: string, callback: function | void | Register event listener |
| `emit(event, data)` | event: string, data: object | void | Emit event to all listeners |
| `getState()` | | object | Get current narrative state |
| `setState(state)` | state: object | void | Restore narrative state |
| `unlockNode(nodeId)` | nodeId: string | void | Unlock a story node |
| `isNodeUnlocked(nodeId)` | nodeId: string | boolean | Check if node is unlocked |
| `getPreviousChapter()` | | number \| null | Get previous chapter ID |

### Event Data Structures

**onChapterLoad**
```javascript
{
  chapterId: number,
  chapter: ChapterObject,
  metrics: { throughput, latency, resilience, energy }
}
```

**onChoiceMade**
```javascript
{
  choiceIndex: number,
  nextChapterId: number,
  result: APIResult
}
```

**onInteractiveTriggered**
```javascript
{
  toolType: string
}
```

**onNavigationUpdate**
```javascript
{
  unlockedNodes: string[]
}
```

## Support & Questions

For issues or questions about the Copilot and NavigatorPlayer integration, refer to:
- Console logs: All major operations log to console with `[NavigatorPlayer]`, `[CopilotAgent]` prefixes
- Debug object: `window.appDebug` contains helpful debugging utilities
- Event system: Monitor NavigatorPlayer events to understand data flow

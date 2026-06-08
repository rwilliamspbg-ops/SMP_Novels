# Chapter 2: System Alerts

## Narrative Content

The diagnostic sequence completed with a **CRITICAL ALERT** flashing across the holographic display. Your fingers trembled as you accessed the emergency logs—the system had recorded events from before your awakening, events it shouldn't have been able to log yet.

**"WARNING:** Quantum coherence threshold breached. Reality stability at 67%."**

The words weren't a glitch. They were a warning from someone—or something—inside the walls of this building.

Then you noticed it: a hidden message embedded in the system logs, formatted like a timestamp but written backwards. **`3100-06-28`**. The year 3100? That's not possible with current technology... unless the quantum computer in your apartment was already talking to itself across time.

A voice crackled over the internal speakers—**Elias**. You hadn't seen him since last week, when you'd agreed to help him debug his personal AI.

**"Hey! I know this sounds crazy, but check your display again. Look at the bottom right corner."**

You squinted. There it was: a tiny pulsing pattern that matched the rhythm of your own heartbeat. Your heart sank—Elias had been monitoring you?

---

## Interactive Choice Node

The system presented three paths forward:

### 📍 Choice A: Contact Elias Immediately
**Action:** Use the encrypted comms channel to reach him

**Consequence:** 
- Establishes direct contact with a trusted ally
- Unlocks Elias's personal AI memory logs (RAG retrieval enabled)
- Risk: Location becomes known to security systems (Thorne faction)

**Narrative Effect:** You're building alliances but also drawing unwanted attention. This path emphasizes trust and collaboration.

---

### 📍 Choice B: Analyze the Heartbeat Pattern
**Action:** Run spectral analysis on the pulsing pattern

**Consequence:** 
- Decodes a hidden message about "the Mirror Layer"
- Unlocks forensic tool access for binary-diff visualization
- Risk: May trigger building-wide lockdown if detected

**Narrative Effect:** You're becoming a digital detective, using technical skills to solve mysteries. This path rewards analytical thinking.

---

### 📍 Choice C: Initiate Emergency Evacuation Protocol
**Action:** Trigger the building's evacuation sequence

**Consequence:** 
- Safely exits the dangerous situation
- Misses critical information about what's happening
- Affinity with Priya increases (she'll help coordinate evacuation)

**Narrative Effect:** You prioritize safety over discovery. This builds resilience but may cause you to miss key plot developments.

---

## Branching Outcomes Preview

| Choice | Unlocks Next Chapter | Character Affinity Changes | System Status Impact |
|--------|---------------------|----------------------------|----------------------|
| A (Contact Elias) | chapter-03-governance-intro.md | +Elias, -Thorne | Quantum stability: 67%→72% |
| B (Analyze Pattern) | chapter-04-mirror-layer.md | -Elias, +Priya | Quantum stability: 67%→58% |
| C (Evacuate) | chapter-05-survival.md | +Priya, -Elias, -Thorne | Quantum stability: 67%→95% |

---

## Technical Metadata

```json
{
  "chapter_id": 2,
  "title": "System Alerts",
  "interactive_element_type": "tri-choice",
  "saga_node": "alert_response_sequence",
  "unlockable_resources": ["encrypted_comms_channel", "spectral_analyzer", "evacuation_protocol"],
  "difficulty_tier": "intermediate",
  "estimated_playtime_minutes": 20,
  "requires_previous_choice": true,
  "parent_chapter": "chapter-01-the-waking"
}
```

---

## Forensic Analysis Tool Access

When choosing **Choice B (Analyze Pattern)**, players gain access to the forensic binary-diff tool:

**Tool Capabilities:**
- Visualize hidden shims within transaction ledgers
- Detect Mirror Layer artifacts in system logs
- Compare current state with historical snapshots
- Export forensic reports for governance review

**Implementation:** See `frontend/src/forensics.js` and `backend/src/mirrorLayerData.js`

---

## Developer Notes

This chapter is a **critical branching point** that determines:

1. **Alliance Building:** Which characters become trusted allies
2. **Discovery Path:** How deep players go into the mystery
3. **Risk Tolerance:** Willingness to engage with dangerous systems

### Key Technical Implementations

- **RAG-Based Memory Retrieval:** Elias's AI logs are retrieved using contextual keywords from player dialogue
- **Quantum Stability Tracking:** Stored in `readers_progress` table JSONB column
- **Branch Selections:** Tracked as array in database for replay mode support

---

## Next Steps for Development

1. Implement Elias character memory retrieval (RAG system)
2. Build forensic tool UI in frontend/src/forensics.js
3. Create Mirror Layer visualization components
4. Set up quantum stability tracking in sagaEngine.js

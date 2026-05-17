/**
 * Cognitive Echo - Enhanced Narrative Data with WASM Exercises & Learning Progress
 */

const narrativeData = {
  chapters: {
    // --- Prologue ---
    0: {
      id: 0,
      title: "Prologue: The Awakening",
      text: "You awaken in the sterile hum of the Aegis Core. Elias Vance, Lead Architect, stares at a cascading wall of diagnostic data. 'The FramePool is leaking,' he mutters, his voice strained. 'If we cannot stabilize the memory allocation, the entire Cognoscent Echo will collapse into noise.'",
      type: "prologue",
      learningOutcomes: ["Introduction to zero-copy memory patterns"],
      duration: 30000, // ms
      interactiveElement: {
        type: "code_snippet",
        id: "chapter0_framepool_intro",
        language: "go",
        description: "Elias is optimizing the FramePool implementation",
        initialCode: `package main

func NewFramePool(frameSize int) *FramePool {
    return &FramePool{
        pool: sync.Pool{New: func() any {
            return make([]byte, frameSize)
        }}
    }
}`,
        learningGoal: "Understand the concept of zero-copy memory allocation"
      }
    },

    // --- Chapter 1: Memory Management Fundamentals ---
    1: {
      id: 1,
      title: "Chapter 1: The FramePool Leak",
      text: "Elias sighs, rubbing his temples. 'It's a Byzantine failure in the consensus layer. The nodes are disagreeing on the state of the memory pool. We need a tighter BFT threshold or we lose everything.'",
      type: "chapter",
      learningOutcomes: [
        "Understanding FramePool architecture",
        "Consensus failure modes",
        "Memory leak debugging techniques"
      ],
      duration: 45000,
      interactiveElement: {
        type: "wasm_exercise",
        exerciseId: "framepool_basics",
        description: "Build a zero-copy FramePool with WASM sandbox validation",
        task: `Write Go code to implement a frame pool with sync.Pool that avoids memory allocation overhead.`,
        starterCode: `package main

import (
    "sync"
)

type FramePool struct {
    pool sync.Pool
    size int
}

// Your implementation goes here...
func NewFramePool(size int) *FramePool {
    // TODO: Implement zero-copy allocation
}`,
        validationRules: [{
            condition: "zero-copy",
            feedback: "✓ Excellent! You're using sync.Pool for efficient memory reuse.",
            learningPoints: ["sync.Pool reuses allocated memory", "Reduces garbage collection pressure", "Improves throughput in hot paths"]
        }, {
            condition: "no-reallocation",
            feedback: "✓ Perfect! Memory is reused within the pool capacity.",
            learningPoints: ["Allocations only happen once per pool", "Memory fragmentation prevented", "Predictable performance characteristics"]
        }],
        expectedCodeLength: 50,
        hint: "Use sync.Pool to pre-allocate buffers that can be recycled"
      },
      choices: [
        { text: "Ask Elias about the leak", nextChapter: 2 },
        { text: "Examine the terminal yourself", nextChapter: 3 }
      ]
    },

    // --- Chapter 2: Consensus Layers ---
    2: {
      id: 2,
      title: "Chapter 2: Byzantine Fault Tolerance",
      text: "The protocol stabilizes, but a sliver of vulnerability remains. The efficiency is higher, but you can feel the centralization creeping in. The Echo is quieter now, but less free.",
      type: "chapter",
      learningOutcomes: [
        "Byzantine Fault Tolerance (BFT) concepts",
        "Threshold signatures",
        "Trade-offs between decentralization and performance"
      ],
      duration: 50000,
      interactiveElement: {
        type: "governance_vote",
        proposalId: "G-2029-047",
        description: "Adjust the BFT Threshold for the Aegis Core Consensus Layer.",
        educationMode: true,
        learningTopic: "Byzantine Fault Tolerance",
        explanation: `BFT ensures system continues functioning even if some nodes fail maliciously. 
                    The threshold determines how many honest nodes are needed to reach consensus.
                    
                    Higher threshold (55.5%): More secure but slower
                    Lower threshold (40%): Faster but less resilient`,
        options: [
            { 
              id: "maintain", 
              text: "Maintain 55.5% Threshold", 
              impact: "Security preserved, throughput optimized",
              learningPoints: ["Threshold > n/3 for BFT safety", "Higher threshold means stronger guarantees"]
            },
            { 
              id: "lower", 
              text: "Lower to 40% for speed", 
              impact: "Vulnerability opens; centralization increases.",
              learningPoints: ["Lower thresholds increase throughput", "But compromise becomes easier", "Trade-off between security and performance"]
            }
        ],
        choiceImpactExplanation: {
            maintain: "Security preserved at cost of throughput. BFT threshold ensures honest nodes remain majority.",
            lower: "Speed improves but system becomes more vulnerable to Byzantine failures."
        }
      },
      choices: [
        { text: "Discuss implications with Elias", nextChapter: 3 },
        { text: "Review governance logs", nextChapter: 4 }
      ]
    },

    // --- Chapter 3: AF_XDP & Network Programming ---
    3: {
      id: 3,
      title: "Chapter 3: Kernel Bypass Networking",
      text: "The terminal flashes with red warnings. You see the AF_XDP descriptors failing to align. The throughput is dropping precipitously.",
      type: "chapter",
      learningOutcomes: [
        "AF_XDP kernel bypass technology",
        "Socket programming basics",
        "Network I/O optimization"
      ],
      duration: 60000,
      interactiveElement: {
        type: "wasm_exercise",
        exerciseId: "network_basics",
        description: "Debug AF_XDP descriptor alignment issues using WASM sandbox",
        task: "Fix the descriptor alignment to restore high-throughput packet processing",
        starterCode: `// Network descriptor configuration for zero-copy packet handling
const RX_DESC_SIZE = 1024; // Bytes
const PACKET_SIZE = 9000;  // Max Ethernet frame

// Descriptor table setup
let descriptors = new ArrayBuffer(RX_DESC_SIZE);
let descPtrs = new Uint32Array(descriptors.buffer, 0, RX_DESC_SIZE/4);

function configureDescriptor(descIndex, packetPtr) {
    // Align descriptor to cache line boundary (64 bytes)
    let alignedOffset = descIndex * 8; 
    return { ptr: packetPtr, length: PACKET_SIZE };
}`,
        validationRules: [{
            condition: "descriptor-alignment",
            feedback: "✓ Correct! Descriptors must be cache-line aligned for prefetching.",
            learningPoints: [
                "Cache line alignment (64 bytes) prevents false sharing",
                "Prefetchers work better with aligned addresses",
                "Reduces latency from cache misses"
            ]
        }, {
            condition: "zero-copy",
            feedback: "✓ Excellent! You're avoiding memory copies in the hot path.",
            learningPoints: [
                "AF_XDP passes packets directly to user space",
                "No kernel buffer copies = higher throughput",
                "Critical for high-frequency trading systems"
            ]
        }],
        expectedCodeLength: 60,
        hint: "Ensure descriptors are cache-line aligned and use AF_XDP ring buffers correctly"
      },
      choices: [
        { text: "Alert Elias immediately", nextChapter: 4 },
        { text: "Try to patch the leak manually", nextChapter: 5 }
      ]
    },

    // --- Chapter 4: System Architecture Patterns ---
    4: {
      id: 4,
      title: "Chapter 4: Distributed Consensus Patterns",
      text: "Your quick fingers dance across the keys. You manage to redirect the leaking packets into a null-sink. The system breathes again, and Elias looks at you with newfound respect.",
      type: "chapter",
      learningOutcomes: [
        "Distributed consensus algorithms",
        "Eventual consistency patterns",
        "Trade-offs in distributed systems"
      ],
      duration: 55000,
      interactiveElement: {
        type: "interactive_design",
        description: "Design a consensus protocol that balances speed and security",
        task: `Choose the right trade-off for our distributed ledger system. We need to balance:
- Throughput (transactions per second)
- Latency (time to finality)
- Security (Byzantine fault tolerance)
- Decentralization (node participation)`,
        components: [
            {
              name: "BFT Threshold",
              defaultValue: 55.5,
              min: 33.3,
              max: 99.9,
              learningPoints: [">n/3 is required for BFT safety", "Higher threshold = more security"]
            },
            {
              name: "Block Size",
              defaultValue: 1000,
              min: 500,
              max: 5000,
              learningPoints: ["Larger blocks = higher throughput", "But slower propagation"]
            }
        ],
        optimalConfiguration: {
            BFT_Threshold: 55.5,
            Block_Size: 2000
        },
        explanation: "Optimal configuration balances security (BFT threshold > n/3) with throughput (reasonable block size).",
        choices: [
            { id: "optimal", text: "Use optimal configuration" },
            { id: "prioritize_speed", text: "Prioritize speed (lower threshold)" }
        ]
      },
      choices: [] // End of main path
    },

    // --- Epilogue: Reflection ---
    5: {
      id: 5,
      title: "Epilogue: The Bigger Picture",
      text: "The Cognoscent Echo stabilizes. You realize that every technical decision carries governance implications. The system you helped build is now a living example of how technology and democracy can coexist in the digital age.",
      type: "epilogue",
      learningOutcomes: [
        "System design thinking",
        "Ethical considerations in tech",
        "Career development advice"
      ],
      duration: 40000,
      interactiveElement: {
        type: "reflection",
        description: "Reflect on your journey through the Aegis Core",
        questions: [
            "What was the most important technical concept you learned?",
            "How will you apply these patterns in your own projects?",
            "What ethical considerations matter most to you as a developer?"
        ],
        recommendations: [
          "Read: 'The Linux Kernel' for deep systems programming insights",
          "Study: Raft consensus algorithm papers from UC Berkeley",
          "Practice: Build your own distributed key-value store",
          "Explore: eBPF programming with BCC tools"
        ],
        skillsToMaster: [
          { name: "Systems Programming", level: "Intermediate" },
          { name: "Distributed Systems", level: "Advanced" },
          { name: "Zero-Copy Techniques", level: "Beginner" }
        ]
      },
      choices: [] // End of narrative
    }
  },

  // --- Metadata ---
  metadata: {
    title: "The Aegis Core: Memory & Consensus Crisis",
    author: "Cognoscent Echo Interactive Platform",
    version: "2.0.0",
    genre: "Technical Thriller / Educational",
    targetAudience: "Developers interested in systems programming, distributed systems, and kernel bypass networking",
    totalChapters: 6,
    estimatedTotalTime: "4-6 hours",
    prerequisites: [
      "Basic knowledge of Go or C/C++",
      "Familiarity with Linux kernel concepts",
      "Interest in distributed consensus algorithms"
    ],
    skillLevels: {
      beginners: ["Chapter 1: Memory Management Fundamentals"],
      intermediate: ["Chapter 2: Consensus Layers", "Chapter 3: AF_XDP Networking"],
      advanced: ["Chapter 4: System Architecture Patterns"]
    }
  },

  // --- Global Learning Outcomes ---
  globalOutcomes: [
    {
      category: "Systems Programming",
      skills: [
        "Zero-copy memory allocation patterns",
        "Cache-line awareness",
        "High-throughput I/O optimization"
      ]
    },
    {
      category: "Distributed Systems",
      skills: [
        "Byzantine Fault Tolerance (BFT)",
        "Consensus algorithm selection",
        "Eventual consistency patterns"
      ]
    },
    {
      category: "Kernel Bypass",
      skills: [
        "AF_XDP ring buffer programming",
        "User-space packet processing",
        "Memory mapping for zero-copy"
      ]
    }
  ]
};

module.exports = narrativeData;

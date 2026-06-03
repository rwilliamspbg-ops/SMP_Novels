import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";

// The AI-driven Navigation Controller
export function NarrativeController({ currentChapter, setChapter }) {
  
  // Action: AI can decide to move the story forward if the user is stuck
  useCopilotAction({
    name: "advance_narrative",
    parameters: [{ name: "chapterId", type: "number" }],
    handler: (args) => {
      setChapter(args.chapterId);
      return `I have synchronized the stream. We are now entering Chapter ${args.chapterId}.`;
    },
  });

  // Action: AI can trigger a specific interactive tool
  useCopilotAction({
    name: "trigger_interactive_tool",
    parameters: [{ name: "toolType", type: "string" }],
    handler: (args) => {
      window.dispatchEvent(new CustomEvent('trigger-tool', { detail: args.toolType }));
      return `Accessing the ${args.toolType} module. The interface is now active.`;
    },
  });

  return null; // Purely a controller
}

export default function App() {
  return (
    <CopilotKit runtimeUrl="/copilotkit">
      <div className="app-container">
        <NarrativeController />
        <MainStoryEngine />
        <CopilotSidebar />
      </div>
    </CopilotKit>
  );
}

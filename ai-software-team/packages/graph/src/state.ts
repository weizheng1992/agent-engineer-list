import { Annotation } from "@langchain/langgraph";

export interface TeamMessage {
  sender: string;
  content: string;
  timestamp: string;
}

// Annotation.Root to define the shared multi-agent team state
export const SoftwareTeamState = Annotation.Root({
  requirement: Annotation<string>(),
  projectPlan: Annotation<string>(),
  codeFiles: Annotation<Record<string, string>>(),
  testResults: Annotation<string>(),
  reviewComments: Annotation<string>(),
  messages: Annotation<TeamMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  currentStep: Annotation<string>(),
  iterationCount: Annotation<number>({
    reducer: (left, right) => right,
    default: () => 0,
  }),
});
export type SoftwareTeamState = typeof SoftwareTeamState.State;
export type SoftwareTeamStateUpdate = typeof SoftwareTeamState.Update;
export { Annotation };

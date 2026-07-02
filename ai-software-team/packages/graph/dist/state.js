import { Annotation } from "@langchain/langgraph";
// Annotation.Root to define the shared multi-agent team state
export const SoftwareTeamState = Annotation.Root({
    requirement: Annotation(),
    projectPlan: Annotation(),
    codeFiles: Annotation(),
    testResults: Annotation(),
    reviewComments: Annotation(),
    messages: Annotation({
        reducer: (left, right) => left.concat(right),
        default: () => [],
    }),
    currentStep: Annotation(),
    iterationCount: Annotation({
        reducer: (left, right) => right,
        default: () => 0,
    }),
});
export { Annotation };
//# sourceMappingURL=state.js.map
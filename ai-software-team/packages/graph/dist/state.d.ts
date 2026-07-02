import { Annotation } from "@langchain/langgraph";
export interface TeamMessage {
    sender: string;
    content: string;
    timestamp: string;
}
export declare const SoftwareTeamState: import("@langchain/langgraph").AnnotationRoot<{
    requirement: import("@langchain/langgraph").LastValue<string>;
    projectPlan: import("@langchain/langgraph").LastValue<string>;
    codeFiles: import("@langchain/langgraph").LastValue<Record<string, string>>;
    testResults: import("@langchain/langgraph").LastValue<string>;
    reviewComments: import("@langchain/langgraph").LastValue<string>;
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<TeamMessage[], TeamMessage[]>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    iterationCount: import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
}>;
export type SoftwareTeamState = typeof SoftwareTeamState.State;
export type SoftwareTeamStateUpdate = typeof SoftwareTeamState.Update;
export { Annotation };
//# sourceMappingURL=state.d.ts.map
export declare const graph: import("@langchain/langgraph").CompiledStateGraph<import("@langchain/langgraph").StateType<{
    requirement: import("@langchain/langgraph").LastValue<string>;
    projectPlan: import("@langchain/langgraph").LastValue<string>;
    codeFiles: import("@langchain/langgraph").LastValue<Record<string, string>>;
    testResults: import("@langchain/langgraph").LastValue<string>;
    reviewComments: import("@langchain/langgraph").LastValue<string>;
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<import("./state.js").TeamMessage[], import("./state.js").TeamMessage[]>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    iterationCount: import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
}>, import("@langchain/langgraph").UpdateType<{
    requirement: import("@langchain/langgraph").LastValue<string>;
    projectPlan: import("@langchain/langgraph").LastValue<string>;
    codeFiles: import("@langchain/langgraph").LastValue<Record<string, string>>;
    testResults: import("@langchain/langgraph").LastValue<string>;
    reviewComments: import("@langchain/langgraph").LastValue<string>;
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<import("./state.js").TeamMessage[], import("./state.js").TeamMessage[]>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    iterationCount: import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
}>, "__start__" | "supervisor" | "architect" | "developer" | "tester" | "reviewer", {
    requirement: import("@langchain/langgraph").LastValue<string>;
    projectPlan: import("@langchain/langgraph").LastValue<string>;
    codeFiles: import("@langchain/langgraph").LastValue<Record<string, string>>;
    testResults: import("@langchain/langgraph").LastValue<string>;
    reviewComments: import("@langchain/langgraph").LastValue<string>;
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<import("./state.js").TeamMessage[], import("./state.js").TeamMessage[]>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    iterationCount: import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
}, {
    requirement: import("@langchain/langgraph").LastValue<string>;
    projectPlan: import("@langchain/langgraph").LastValue<string>;
    codeFiles: import("@langchain/langgraph").LastValue<Record<string, string>>;
    testResults: import("@langchain/langgraph").LastValue<string>;
    reviewComments: import("@langchain/langgraph").LastValue<string>;
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<import("./state.js").TeamMessage[], import("./state.js").TeamMessage[]>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    iterationCount: import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
}, import("@langchain/langgraph").StateDefinition>;
//# sourceMappingURL=workflow.d.ts.map
export interface Tool {
    name: string;
    description: string;
    execute: (...args: any[]) => Promise<any>;
}
export declare const filesystemTools: {
    name: string;
    description: string;
};
export declare const sandboxTools: {
    name: string;
    description: string;
};
export declare const githubTools: {
    name: string;
    description: string;
};
//# sourceMappingURL=index.d.ts.map
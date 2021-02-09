import { SfdxCommand } from "@salesforce/command";
export default class Fix extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {};
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
    private fixContract;
}
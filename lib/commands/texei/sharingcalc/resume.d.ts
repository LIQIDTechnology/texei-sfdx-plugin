import { flags, SfdxCommand } from "@salesforce/command";
export default class Resume extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        scope: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
    private resumeSharingCalc;
}

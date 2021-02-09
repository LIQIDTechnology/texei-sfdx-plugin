import { flags, SfdxCommand } from "@salesforce/command";
export default class Retrieve extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        timeout: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    nodesToRemove: string[];
    nodesHavingDefault: string[];
    run(): Promise<any>;
    private retrievePackage;
    cleanProfile(profile: string): Promise<any>;
}

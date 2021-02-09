import { flags, SfdxCommand } from "@salesforce/command";
export default class Add extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        label: flags.Discriminated<flags.Option<string>>;
        apiname: flags.Discriminated<flags.Option<string>>;
        statuscategory: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
}

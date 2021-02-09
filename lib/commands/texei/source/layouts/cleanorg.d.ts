import { flags, SfdxCommand } from '@salesforce/command';
export default class CleanOrg extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        path: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
}

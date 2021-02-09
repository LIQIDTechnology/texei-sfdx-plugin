import { flags, SfdxCommand } from '@salesforce/command';
export default class Clean extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        keep: flags.Discriminated<flags.Option<string>>;
        path: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
    private getProfilesInPath;
    private getDefaultPath;
}

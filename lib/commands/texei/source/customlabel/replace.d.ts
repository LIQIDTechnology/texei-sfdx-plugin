import { flags, SfdxCommand } from '@salesforce/command';
export default class Replace extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        path: flags.Discriminated<flags.Option<string>>;
        label: flags.Discriminated<flags.Option<string>>;
        value: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
}

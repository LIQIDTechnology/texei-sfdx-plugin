import { SfdxCommand, flags } from '@salesforce/command';
export default class Update extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        values: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
}

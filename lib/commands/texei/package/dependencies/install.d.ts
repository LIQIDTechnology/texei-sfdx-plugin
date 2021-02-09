import { flags, SfdxCommand } from '@salesforce/command';
export default class Install extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        installationkeys: flags.Discriminated<flags.Option<string>>;
        branch: flags.Discriminated<flags.Option<string>>;
        packages: flags.Discriminated<flags.Option<string>>;
        securitytype: flags.Discriminated<flags.Option<string>>;
        namespaces: flags.Discriminated<flags.Option<string>>;
        wait: flags.Discriminated<flags.Number>;
        noprompt: flags.Discriminated<flags.Boolean<boolean>>;
        apexcompile: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
    private getPackageVersionId;
}

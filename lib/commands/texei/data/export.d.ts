import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class Export extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        outputdir: flags.Discriminated<flags.Option<string>>;
        objects: flags.Discriminated<flags.Option<string>>;
        dataplan: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
    private getsObjectRecords;
    private cleanJsonRecord;
    private saveFile;
}

import { flags, SfdxCommand } from "@salesforce/command";
import { AnyJson } from "@salesforce/ts-types";
export default class Import extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        inputdir: flags.Discriminated<flags.Option<string>>;
        allornone: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
    private prepareDataForInsert;
    private upsertData;
    private readFile;
    private getRecordTypeMap;
    private updateMapIdRef;
    private getObjectNameFromFile;
    private getLookupsForObject;
}

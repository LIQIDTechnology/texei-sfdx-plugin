import { core } from "@salesforce/command";
export declare class StandardValueSetHelper {
    _connection: any;
    _standardValueSetName: any;
    _existingValues: any[];
    browser: any;
    page: any;
    navigationPromise: any;
    constructor(connection: core.Connection, standardValueSetName: string);
    init(): Promise<void>;
    addValue(label: string, apiName: string, statusCategory: string): Promise<string>;
    close(): Promise<void>;
}

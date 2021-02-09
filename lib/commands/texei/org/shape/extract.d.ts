import { SfdxCommand, flags } from '@salesforce/command';
export default class Extract extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        outputdir: flags.Discriminated<flags.Option<string>>;
        scope: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static requiresDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<any>;
    private toLowerCamelCase;
    private removeQuotes;
    private formatSetting;
    /**
     * This maps organization types to one of the 4 available scratch org editions with the fallback of "Developer".
     * Sources:
     *  [Way to identify Salesforce edition using API?](https://salesforce.stackexchange.com/questions/216/way-to-identify-salesforce-edition-using-api)
     *  [Salesforce Editions That Are No Longer Sold](https://help.salesforce.com/articleView?id=overview_other_editions.htm&type=5)
     *  [Scratch Org Definition Configuration Values](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm)
     * @param organizationType
     */
    private mapOrganizationTypeToScratchOrgEdition;
}

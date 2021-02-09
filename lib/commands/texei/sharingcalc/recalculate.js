"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const puppeteer = require("puppeteer");
// Initialize Messages with the current plugin directory
command_1.core.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = command_1.core.Messages.loadMessages("texei-sfdx-plugin", "sharingcalc-recalculate");
const mapSharingLabel = new Map([
    ['sharingRule', 'Sharing Rule']
]);
class Recalculate extends command_1.SfdxCommand {
    async run() {
        let result = {};
        await this.reclaculateSharing();
        return result;
    }
    async reclaculateSharing() {
        const instanceUrl = this.org.getConnection().instanceUrl;
        const SHARING_CALC_PATH = "/p/own/DeferSharingSetupPage";
        this.ux.startSpinner(`Resuming ${mapSharingLabel.get(this.flags.scope)} Calculations`, null, { stdout: true });
        this.debug(`DEBUG Login to Org`);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: !(process.env.BROWSER_DEBUG === "true")
        });
        const page = await browser.newPage();
        await page.goto(`${instanceUrl}/secur/frontdoor.jsp?sid=${this.org.getConnection().accessToken}`, { waitUntil: ["domcontentloaded", "networkidle0"] });
        const navigationPromise = page.waitForNavigation();
        this.debug(`DEBUG Opening Defer Sharing Calculations page`);
        await page.goto(`${instanceUrl + SHARING_CALC_PATH}`);
        await navigationPromise;
        this.debug(`DEBUG Clicking 'Recalculate' button`);
        try {
            await page.click(`#ep > .pbBody > .pbSubsection > .detailList > tbody > .detailRow > td > input[name="rule_recalc"].btn`);
        }
        catch (ex) {
            console.log('Unable to recalculate sharing.', ex.message);
        }
        await navigationPromise;
        this.debug(`DEBUG Closing browser`);
        await browser.close();
        this.ux.stopSpinner("Done.");
        return { message: `Recalculated ${mapSharingLabel.get(this.flags.scope)}s` };
    }
}
Recalculate.description = messages.getMessage("commandDescription");
Recalculate.examples = [
    `$ sfdx texei:sharingcalc:recalculate" \nRecalculated Sharing Rules\n`
];
Recalculate.flagsConfig = {
    scope: command_1.flags.string({
        char: "s",
        description: messages.getMessage("scopeFlagDescription"),
        required: false,
        options: ["sharingRule"],
        default: "sharingRule"
    })
};
// Comment this out if your command does not require an org username
Recalculate.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Recalculate.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Recalculate.requiresProject = false;
exports.default = Recalculate;
//# sourceMappingURL=recalculate.js.map
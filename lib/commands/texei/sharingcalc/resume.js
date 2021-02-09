"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const puppeteer = require("puppeteer");
// Initialize Messages with the current plugin directory
command_1.core.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = command_1.core.Messages.loadMessages("texei-sfdx-plugin", "sharingcalc-resume");
const mapSharingLabel = new Map([
    ['sharingRule', 'Sharing Rule'],
    ['groupMembership', 'Group Membership']
]);
class Resume extends command_1.SfdxCommand {
    async run() {
        let result = {};
        await this.resumeSharingCalc();
        return result;
    }
    async resumeSharingCalc() {
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
        this.debug(`DEBUG Clicking 'Resume' button`);
        try {
            // Resume either Group Membership or Sharing Rules
            if (this.flags.scope === "groupMembership") {
                await page.click(`#gmSect > .pbBody > .pbSubsection > .detailList > tbody > .detailRow > td > input[name="group_resume"].btn`);
                // click the yes button to recaulcate group memberships immediately
                await page.click(`div#group_resume_dialog_buttons > input[value=" Yes "]`);
            }
            else {
                await page.click(`#ep > .pbBody > .pbSubsection > .detailList > tbody > .detailRow > td > input[name="rule_resume"].btn`);
            }
        }
        catch (ex) {
            console.log('Unable to resume sharing.', ex.message);
        }
        await navigationPromise;
        this.debug(`DEBUG Closing browser`);
        await browser.close();
        this.ux.stopSpinner("Done.");
        return { message: `Resumed ${mapSharingLabel.get(this.flags.scope)} Calculations` };
    }
}
Resume.description = messages.getMessage("commandDescription");
Resume.examples = [
    `$ sfdx texei:sharingcalc:resume" \nSharing calculations resumed\n`
];
Resume.flagsConfig = {
    scope: command_1.flags.string({
        char: "s",
        description: messages.getMessage("scopeFlagDescription"),
        required: false,
        options: ["sharingRule", "groupMembership"],
        default: "sharingRule"
    })
};
// Comment this out if your command does not require an org username
Resume.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Resume.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Resume.requiresProject = false;
exports.default = Resume;
//# sourceMappingURL=resume.js.map
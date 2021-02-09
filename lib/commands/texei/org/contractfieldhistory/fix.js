"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const puppeteer = require("puppeteer");
// Initialize Messages with the current plugin directory
command_1.core.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = command_1.core.Messages.loadMessages("texei-sfdx-plugin", "org-contractfieldhistory-fix");
class Fix extends command_1.SfdxCommand {
    async run() {
        let result = {};
        await this.fixContract();
        return result;
    }
    async fixContract() {
        const instanceUrl = this.org.getConnection().instanceUrl;
        const POST_LOGIN_PATH = "/ui/setup/layout/FieldHistoryTracking?pEntity=Contract";
        this.ux.startSpinner('Fixing Contract Field History', null, { stdout: true });
        this.debug(`DEBUG Login to Scratch Org`);
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: !(process.env.BROWSER_DEBUG === 'true')
        });
        const page = await browser.newPage();
        await page.goto(`${instanceUrl}/secur/frontdoor.jsp?sid=${this.org.getConnection().accessToken}&startURL=${encodeURIComponent(POST_LOGIN_PATH)}`, { waitUntil: ["domcontentloaded", "networkidle0"] });
        const navigationPromise = page.waitForNavigation();
        this.debug(`DEBUG Opening Contract Field History Tracking page`);
        await page.goto(`${instanceUrl}/ui/setup/layout/FieldHistoryTracking?pEntity=Contract`);
        await navigationPromise;
        this.debug(`DEBUG Clicking 'Save' button`);
        await page.click("table > tbody > tr > #topButtonRow > .btn:nth-child(1)");
        await navigationPromise;
        this.debug(`DEBUG Closing browser`);
        await browser.close();
        this.ux.stopSpinner('Done.');
        return { message: 'Fixed Contract Fied History Tracking' };
    }
}
Fix.description = messages.getMessage("commandDescription");
Fix.examples = [
    `$ sfdx texei:org:contractfieldhistory:fix" \nHistory tracking fixed.\n`
];
Fix.flagsConfig = {};
// Comment this out if your command does not require an org username
Fix.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Fix.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Fix.requiresProject = false;
exports.default = Fix;
//# sourceMappingURL=fix.js.map
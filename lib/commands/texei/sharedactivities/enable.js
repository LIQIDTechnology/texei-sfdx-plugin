"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const puppeteer = require("puppeteer");
// Initialize Messages with the current plugin directory
command_1.core.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = command_1.core.Messages.loadMessages("texei-sfdx-plugin", "sharedactivities-enable");
class Enable extends command_1.SfdxCommand {
    async run() {
        let result = {};
        await this.enableSharedActivities();
        return result;
    }
    async enableSharedActivities() {
        const instanceUrl = this.org.getConnection().instanceUrl;
        const ACTIVITIES_SETTINGS_PATH = "/setup/activitiesSetupPage.apexp";
        this.ux.startSpinner(`Enabling Shared Activities`, null, { stdout: true });
        this.debug(`DEBUG Login to Org`);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: !(process.env.BROWSER_DEBUG === "true")
        });
        const page = await browser.newPage();
        await page.goto(`${instanceUrl}/secur/frontdoor.jsp?sid=${this.org.getConnection().accessToken}`, { waitUntil: ["domcontentloaded", "networkidle0"] });
        const navigationPromise = page.waitForNavigation();
        this.debug(`DEBUG Opening Activity Settings page`);
        await page.goto(`${instanceUrl + ACTIVITIES_SETTINGS_PATH}`);
        await navigationPromise;
        this.debug(`DEBUG Clicking 'Allow Users to Relate Multiple Contacts to Tasks and Events' checkbox`);
        await page.click('input[id="thePage:theForm:theBlock:manyWhoPref"]');
        this.debug(`DEBUG Clicking 'Submit' button`);
        await page.click('input[id="thePage:theForm:theBlock:buttons:submit"]');
        await navigationPromise;
        this.debug(`DEBUG Closing browser`);
        await browser.close();
        this.ux.stopSpinner("Done.");
        return { message: `Enabled Shared Activities` };
    }
}
Enable.description = messages.getMessage("commandDescription");
Enable.examples = [
    `$ sfdx texei:sharedactivities:enable`
];
Enable.flagsConfig = {};
// Comment this out if your command does not require an org username
Enable.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Enable.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Enable.requiresProject = false;
exports.default = Enable;
//# sourceMappingURL=enable.js.map
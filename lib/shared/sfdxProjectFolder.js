"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This helper is just a draft for now
// TODO: Do more generic functions, better suffid handling, test folder exists everywhere
// Also maybe some attribute to ask for just name, file name, full name for retrieve
// ex. for record type: MyRecordTypeForAccount, MyRecordTypeForAccount.recordType-meta.xml, Account.MyRecordTypeForAccount
const core_1 = require("@salesforce/core");
const path = require("path");
const fs = require("fs");
const util = require('util');
async function getMetadata(metadata) {
    // TODO: ignore some files
    // like .eslintrc.json and jsconfig.json
    const readDir = util.promisify(fs.readdir);
    const metadataPath = path.join('force-app', 'main', 'default', metadata);
    // TODO: fix it correctly for all metadata types
    let metadatas = [];
    if (fs.existsSync(metadataPath)) {
        metadatas = (await readDir(metadataPath, 'utf8')).map(m => m.replace('.profile-meta.xml', ''));
    }
    return metadatas;
}
exports.getMetadata = getMetadata;
async function getFieldsForObject(objectName) {
    const readDir = util.promisify(fs.readdir);
    const fieldsPath = path.join('force-app', 'main', 'default', 'objects', objectName, 'fields');
    let fields = [];
    if (fs.existsSync(fieldsPath)) {
        fields = (await readDir(fieldsPath, 'utf8'))
            .map(f => f.substring(0, f.lastIndexOf('.field-meta.xml')));
    }
    return fields;
}
exports.getFieldsForObject = getFieldsForObject;
async function getRecordTypesForObject(objectName) {
    const readDir = util.promisify(fs.readdir);
    const recordTypesPath = path.join('force-app', 'main', 'default', 'objects', objectName, 'recordTypes');
    let recordTypes = [];
    if (fs.existsSync(recordTypesPath)) {
        recordTypes = (await readDir(recordTypesPath, 'utf8'))
            .map(f => `${objectName}.${f.substring(0, f.lastIndexOf('.recordType-meta.xml'))}`);
    }
    return recordTypes;
}
exports.getRecordTypesForObject = getRecordTypesForObject;
async function getCompactLayoutsForObject(objectName) {
    const readDir = util.promisify(fs.readdir);
    const compactLayoutsPath = path.join('force-app', 'main', 'default', 'objects', objectName, 'compactLayouts');
    let compactLayouts = [];
    if (fs.existsSync(compactLayoutsPath)) {
        compactLayouts = (await readDir(compactLayoutsPath, 'utf8'))
            .map(f => f.substring(0, f.lastIndexOf('.compactLayout-meta.xml')));
    }
    return compactLayouts;
}
exports.getCompactLayoutsForObject = getCompactLayoutsForObject;
async function getLayoutsForObject(objectName) {
    const readDir = util.promisify(fs.readdir);
    const layoutsPath = path.join('force-app', 'main', 'default', 'layouts');
    let layouts = [];
    if (fs.existsSync(layoutsPath)) {
        layouts = (await readDir(layoutsPath, 'utf8'))
            .filter(l => l.startsWith(objectName + '-'))
            .map(l => l.substring(0, l.lastIndexOf('.layout-meta.xml')));
    }
    return layouts;
}
exports.getLayoutsForObject = getLayoutsForObject;
async function getDefaultProjectPath() {
    let defaultProjectPath = undefined;
    const options = core_1.SfdxProjectJson.getDefaultOptions();
    const project = await core_1.SfdxProjectJson.create(options);
    const packageDirectories = project.get('packageDirectories') || [];
    for (let packageDirectory of packageDirectories) {
        packageDirectory = packageDirectory;
        if (packageDirectory.default) {
            defaultProjectPath = packageDirectory.path;
        }
    }
    return defaultProjectPath;
}
exports.getDefaultProjectPath = getDefaultProjectPath;
//# sourceMappingURL=sfdxProjectFolder.js.map
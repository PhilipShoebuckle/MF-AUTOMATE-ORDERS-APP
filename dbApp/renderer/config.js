const Store = require('electron-store');
const store = new Store();

function getServer() {
    const defaultStr = '[Server Name]';
    const storedStr = store.get('server');
    if(storedStr) return storedStr;
    else return defaultStr;
}

function setServer(name) {
    store.set('server', name);
}

function getDB() {
    const defaultStr = '[Database Name]';
    const storedStr = store.get('db');
    if(storedStr) return storedStr;
    else return defaultStr;
}

function setDB(name) {
    store.set('db', name);
}

function getTable() {
    const defaultTbl = '[Table Name]';
    const storedTbl = store.get('table');
    if(storedTbl) return storedTbl;
    else return defaultTbl;
}

function setTable(name) {
    store.set('table', name);
}

function getDataFolder() {
    const defaultFldr = '[No Folder Path Set]';
    const storedFldr = store.get('dataFolder');
    if(storedFldr) return storedFldr;
    else return defaultFldr;
}

function setDataFolder(path) {
    store.set('dataFolder', path)
}

function getldt() {
    const defaultDt = '1980-01-01';
    const storedDt = store.get('ldt');
    if(storedDt) return storedDt;
    else return defaultDt;
}

function setldt(dt) {
    store.set('ldt', dt);
}

module.exports = {getServer, setServer, getDB, setDB, getTable, setTable, getDataFolder, setDataFolder, getldt, setldt};
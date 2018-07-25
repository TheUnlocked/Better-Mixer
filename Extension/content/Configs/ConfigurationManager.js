import Config from "./Config";

export default class ConfigurationManager {
    constructor(plugin) {

        this.plugin = plugin;
        this._configs = {};


    }

    /**
     * @param {Config} config 
     */
    registerConfigPromise(config){
        return new Promise((resolve, _) => {
            _configs[config.configName] = config;
            chrome.storage.sync.get(config.configName, state => {
                if (state[config.configName] === undefined){
                    chrome.storage.sync.set({[config.configName]: config.defaultState});
                    config.state = config.defaultState;
                }
                else{
                    config.state = state[config.configName];
                }
                resolve();
            });
        });
    }

    /**
     * @param {Config} config 
     */
    registerConfig(config){
        _configs[config.configName] = config;
        chrome.storage.sync.get(config.configName, state => {
            if (state[config.configName] === undefined){
                chrome.storage.sync.set({[config.configName]: config.defaultState});
                config.state = config.defaultState;
            }
            else{
                config.state = state[config.configName];
            }
        });
    }

    saveConfig(){
        for (let configName in this._configs){
            chrome.storage.sync.set(Object.keys(this._configs).reduce((obj, key) => obj[key] = this._configs[key].state));
        }
    }

    updateConfig(){
        for (let configName in this._configs){
            this._configs[configName].update();
        }
    }
}
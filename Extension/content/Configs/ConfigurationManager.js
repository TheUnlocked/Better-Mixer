import Config from "./Config.js";
import BetterMixer from "../BetterMixer.js";
import { observeNewElements } from "../Utility/Util.js";

let SRC = document.getElementById('BetterMixer-module').src;

export default class ConfigurationManager {
    /**
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {

        this.plugin = plugin;
        this._configs = {};
        this._registerBuffer = [];

        let initializeListener = event => {
            if (event.data[0] == SRC){
                let data = event.data[1];
                if (data.message == 'sendAllConfigs'){
                    window.removeEventListener('message', initializeListener);

                    this._recvconfigs = data.data || {};

                    this._registerBuffer.forEach(config => this.registerConfig(config));
                    
                    this.plugin.log('Config loaded.');
                }
            }
        };
        window.addEventListener('message', initializeListener);
        plugin.postToContent({message: 'getAllConfigs'});

        this._configDialogObserver = observeNewElements('[class*="wrapper"] h1', document.documentElement, element => {
            if (element.innerText == "CHAT SETTINGS"){
                this.plugin.dispatchEvent(BetterMixer.Events.ON_SETTINGS_DIALOG_OPEN, { dialog: element.parentElement }, this);
            }
        });
    }

    /**
     * Warning: This method may register the config asynchronously.
     * @param {Config} config
     * @param {Function?} callback
     */
    registerConfig(config, callback = undefined){
        this._configs[config.configName] = config;

        if (!config.___cb){
            config.___cb = [];
        }

        if (!this._recvconfigs){
            if (callback)
                config.___cb.push(callback);
            this._registerBuffer.push(config);
            return;
        }
        
        if (this._recvconfigs[config.configName] === undefined){
            this.plugin.postToContent({message: 'setConfigs', data: {[config.configName]: config.defaultState}});
            config.state = config.defaultState;
        }
        else{
            config.state = this._recvconfigs[config.configName];
        }
        
        for (let cb of config.___cb){
            cb(config);
        }
        delete config.___cb;

        config.update();
    }

    saveConfig(){
        this.plugin.postToContent({message: 'setConfigs', data: Object.keys(this._configs).reduce((result, value) => {
            result[value] = this._configs[value].state;
            return result;
        }, {})});
    }

    updateConfig(){
        for (let configName in this._configs){
            this._configs[configName].update();
        }
    }

    /**
     * 
     * @param {string} configName 
     * @returns {Config}
     */
    getConfig(configName){
        return this._configs[configName];
    }

    getConfigAsync(configName, callback){
        if (this._recvconfigs){
            callback(this._configs[configName]);
        }
        else{
            this._configs[configName].___cb.push(callback);
        }
    }

    getAllConfigs(){
        return Object.keys(this._configs).reduce((result, value) => { result.push(this._configs[value]); return result; }, []);
    }
}
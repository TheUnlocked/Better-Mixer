import Config from "./Config.js";
import BetterMixer from "../BetterMixer.js";

let SRC = document.getElementById('BetterMixer-module').src;

export default class ConfigurationManager {
    /**
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {

        this.plugin = plugin;
        this._configs = {};
        this._registerBuffer = [];

        plugin.postToContent({message: 'getAllConfigs'});

        let initializeListener = event => {
            if (event.data[0] == SRC){
                let data = event.data[1];
                if (data.message == 'sendAllConfigs'){
                    window.removeEventListener('message', initializeListener);

                    this._recvconfigs = data.data;

                    this._registerBuffer.forEach(config => this.registerConfig(config));
                    
                    this.plugin.log('Config loaded.');
                }
            }
        };
        window.addEventListener('message', initializeListener);
    }

    /**
     * Warning: This method may register the config asynchronously.
     * @param {Config} config 
     */
    registerConfig(config){
        this._configs[config.configName] = config;

        if (!this._recvconfigs){
            this._registerBuffer.push(config);
            return;
        }
        
        if (this._recvconfigs[config.configName] === undefined){
            plugin.postToContent({message: 'setConfigs', data: {[config.configName]: config.defaultState}});
            config.state = config.defaultState;
        }
        else{
            config.state = this._recvconfigs[config.configName];
        }
        config.update();
    }

    saveConfig(){
        plugin.postToContent({message: 'setConfigs', data: Object.keys(this._configs).reduce((obj, key) => obj[key] = this._configs[key].state)});
    }

    updateConfig(){
        for (let configName in this._configs){
            this._configs[configName].update();
        }
    }
}
import Config from "./Config.js";
import BetterMixer from "../BetterMixer.js";
import { observeNewElements } from "../Utility/Promise.js";
import { ConfigMap } from "./DefaultConfigs.js";

const SRC = __COMPILER_INLINE('target') === 'script' ? 'better_mixer_user_script' : (document.getElementById('BetterMixer-module') as HTMLImageElement).src;

export default class ConfigurationManager {
    plugin: BetterMixer;
    
    private _configs: {[configName: string]: Config<any>};
    private _registerBuffer: Config<any>[];
    private _recvconfigs: any;
    private _configDialogObserver: MutationObserver;

    constructor(plugin: BetterMixer) {

        this.plugin = plugin;
        this._configs = {};
        this._registerBuffer = [];

        const initializeListener = (event: MessageEvent) => {
            if (event.data[0] === SRC) {
                const data = event.data[1];
                if (data.message === 'sendAllConfigs') {
                    window.removeEventListener('message', initializeListener);

                    this._recvconfigs = data.data || {};

                    this._registerBuffer.forEach(config => this.registerConfig(config));
                    
                    this.plugin.log('Config loaded.');
                }
            }
        };
        window.addEventListener('message', initializeListener);
        plugin.postToContent({message: 'getAllConfigs'});

        this._configDialogObserver = observeNewElements('[class*="modal"] h1', document.documentElement, element => {
            if (element.innerHTML === "Chat Settings") {
                this.plugin.dispatchEvent('settingsDialogOpen', { dialog: element.parentElement! }, this);
            }
        });
    }

    /**
     * Warning: This method may register the config asynchronously.
     * @param {Config} config
     * @param {Function?} callback
     */
    registerConfig<C extends keyof ConfigMap>(config: Config<ConfigMap[C]> & {__cb?: ((config: Config<ConfigMap[C]>) => void)[]}, callback?: (config: Config<ConfigMap[C]>) => void): void;
    registerConfig<T>(config: Config<T> & {__cb?: ((config: Config<T>) => void)[]}, callback?: (config: Config<T>) => void): void;
    registerConfig(config: Config<any> & {__cb?: ((config: Config<any>) => void)[]}, callback?: (config: Config<any>) => void) {
        this._configs[config.configName] = config;
        if (!config.__cb) {
            config.__cb = [];
        }

        if (!this._recvconfigs) {
            if (callback)
                config.__cb.push(callback);
            this._registerBuffer.push(config);
            return;
        }
        
        if (this._recvconfigs[config.configName] === undefined) {
            this.plugin.postToContent({message: 'setConfigs', data: {[config.configName]: config.defaultState}});
            config.state = config.defaultState;
        }
        else {
            config.state = this._recvconfigs[config.configName];
        }
        
        for (const cb of config.__cb) {
            cb(config);
        }
        delete config.__cb;

        config.update();
    }

    saveConfig(_configs?: string[]) {
        const configs = _configs ? _configs : Object.keys(this._configs);
        this.plugin.postToContent({
            message: 'setConfigs', data: configs.reduce((result, value) => {
                result[value] = this._configs[value].state;
                return result;
            }, {} as {[configName: string]: any})
        });
    }

    updateConfig() {
        for (const configName in this._configs) {
            this._configs[configName].update();
        }
    }

    getConfig<C extends keyof ConfigMap>(configName: C): Config<ConfigMap[C]>;
    getConfig<T>(configName: string): Config<T>;
    getConfig(configName: string) {
        return this._configs[configName];
    }

    async getConfigAsync<C extends keyof ConfigMap>(configName: C): Promise<Config<ConfigMap[C]>>;
    async getConfigAsync<T>(configName: string): Promise<Config<T>>;
    getConfigAsync(configName: string): Promise<Config<any>> {
        return new Promise(resolve => {
            if (this._recvconfigs) {
                resolve(this._configs[configName]);
            }
            else {
                (this._configs[configName] as Config<any> & {__cb?: ((config: Config<any>) => void)[]}).__cb!.push(resolve);
            }
        });
    }

    getAllConfigs() {
        return Object.keys(this._configs).reduce((result, value) => { result.push(this._configs[value]); return result; }, [] as Config<any>[]);
    }
}
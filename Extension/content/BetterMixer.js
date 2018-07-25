import FFZAddon from "./Addons/FFZ/FFZAddon";
import GameWispAddon from "./Addons/GameWisp/GameWispAddon";
import ConfigurationManager from "./Configs/ConfigurationManager";

export default class BetterMixer {
    constructor(){

        this.log("Better Mixer loaded.");

        this.ffz = new FFZAddon(this);
        this.gameWisp = new GameWispAddon(this);
        this.configuration = new ConfigurationManager(this);

        $(window).on('pushState', () => setTimeout(this.reload(), 100));

        this.injectFile("lib/css/inject.css", BetterMixer.InjectionTypeEnum.STYLESHEET);
        this.injectFile("lib/js/inject.js", BetterMixer.InjectionTypeEnum.SCRIPT);

        this.injectFile("lib/css/botcolor.css", BetterMixer.InjectionTypeEnum.STYLESHEET,
            element => this.configuration.registerConfig(new StylesheetToggleConfig(element, 'botcolor_enabled', 'Change Bot Colors', true, true)));
        this.injectFile("lib/css/movebadges.css", BetterMixer.InjectionTypeEnum.STYLESHEET,
            element => this.configuration.registerConfig(new StylesheetToggleConfig(element, 'move_badges', 'Show Badges Before Username', false, true)));
        this.injectFile("lib/css/alternatelinecolors.css", BetterMixer.InjectionTypeEnum.STYLESHEET, 
            element => this.configuration.registerConfig(new StylesheetToggleConfig(element, 'alternate_line_colors', 'Alternate Chat Line Colors', false, true)));
        this.injectFile("lib/css/hideavatars.css", BetterMixer.InjectionTypeEnum.STYLESHEET,
            element => this.configuration.registerConfig(new StylesheetToggleConfig(element, 'hide_avatars', 'Hide Avatars', false, true)));
        

    }

    reload(){

    }

    injectFile(file, type, callback){
        let injection;
        switch (type) {
            
            case BetterMixer.InjectionTypeEnum.STYLESHEET:
                chrome.runtime.sendMessage({request: "geturl", data: file}, function (response) {
                    let injection = document.createElement('link');
                    injection.rel = 'stylesheet';
                    injection.href = response;
                    document.head.appendChild(injection);
                });
                break;

            case BetterMixer.InjectionTypeEnum.SCRIPT:
                chrome.runtime.sendMessage({request: "geturl", data: file}, function (response) {
                    let injection = document.createElement('script');
                    injection.src = response;
                    document.head.appendChild(injection);
                });
                break;

            default:
                break;
        }
        if (callback){
            callback(injection);
        }
    }

    log(msg){
        console.log(`[Better Mixer] ${msg}`);
    }
}

BetterMixer.InjectionTypeEnum = Object.freeze({
    STYLESHEET: 0,
    SCRIPT: 1
});

BetterMixer.instance = new BetterMixer();
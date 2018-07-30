import FFZAddon from "./Addons/FFZ/FFZAddon.js";
import GameWispAddon from "./Addons/GameWisp/GameWispAddon.js";
import ConfigurationManager from "./Configs/ConfigurationManager.js";
import StylesheetToggleConfig from "./Configs/StylesheetToggleConfig.js";

let SRC = document.getElementById('BetterMixer-module').src;
let BASE_URL = SRC.split('/').slice(0, -2).join('/') + '/';

export default class BetterMixer {
    constructor(){

        this.log("Base loaded.");

        this.ffz = new FFZAddon(this);
        this.gameWisp = new GameWispAddon(this);
        this.configuration = new ConfigurationManager(this);

        $(window).on('pushState', () => setTimeout(this.reload(), 100));

        this.injectStylesheet("lib/css/inject.css");

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/botcolor.css"),
            'botcolor_enabled', 'Change Bot Colors', true, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/movebadges.css"),
            'move_badges', 'Show Badges Before Username', false, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/alternatelinecolors.css"),
            'alternate_line_colors', 'Alternate Chat Line Colors', false, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/hideavatars.css"),
            'hide_avatars', 'Hide Avatars', false, true));
    }

    reload(){
        
    }

    injectStylesheet(file){
        let injection;
        injection = document.createElement('link');
        injection.rel = 'stylesheet';
        injection.href = BASE_URL + file;
        document.head.appendChild(injection);
        return injection;
    }

    log(msg){
        console.log(`[Better Mixer] ${msg}`);
    }

    postToContent(message){
        window.postMessage([SRC, message], '*');
    }
}

BetterMixer.instance = new BetterMixer();
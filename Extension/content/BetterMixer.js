import "../lib/js/jquery-3.3.1.min.js";
import "../lib/js/jquery.initialize.min.js";

import FFZAddon from "./Addons/FFZ/FFZAddon.js";
import GameWispAddon from "./Addons/GameWisp/GameWispAddon.js";
import ConfigurationManager from "./Configs/ConfigurationManager.js";
import StylesheetToggleConfig from "./Configs/StylesheetToggleConfig.js";
import Channel from "./Channel.js";
import Patcher from "./Patcher.js";

let SRC = document.getElementById('BetterMixer-module').src;
let BASE_URL = SRC.split('/').slice(0, -2).join('/') + '/';

export default class BetterMixer {
    constructor(){

        this.log("Base loaded.");

        this.configuration = new ConfigurationManager(this);
        this.ffz = new FFZAddon(this);
        this.gameWisp = new GameWispAddon(this);
        this.activeChannels = [];

        this._events = [];
        for (let _ in BetterMixer.Events){
            this._events.push([]);
        }

        // Reload on page change
        (function(history){
            var pushState = history.pushState;
            history.pushState = function(state) {
                if (typeof history.onpushstate == "function") {
                    history.onpushstate({state: state});
                }
        
                let ret = pushState.apply(history, arguments);

                setTimeout(BetterMixer.instance.reload(), 100);

                return ret;
            };
        })(window.history);

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

        setTimeout(() => this.reload(), 0);

        window.onbeforeunload = () => {
            for (let channel of this.activeChannels){
                channel.unload();
            }
        };

        this.patcher = new Patcher(this);
    }

    reload(){
        let page = window.location.pathname.split('/').pop().toLowerCase();
        this.log(`Switched to page '${page}'`);
        if (page != "" && !page.endsWith(')')){
            for (let channel of this.activeChannels){
                channel.unload();
            }
            this.activeChannels = [];
            let mainChannel = new Channel(this, page);
            if (mainChannel.id){
                this.activeChannels.push();
            }
        }
    }

    injectStylesheet(file){
        let injection;
        injection = document.createElement('link');
        injection.rel = 'stylesheet';
        injection.href = BASE_URL + file;
        document.head.appendChild(injection);
        return injection;
    }

    log(msg, logType = BetterMixer.LogType.INFO){
        switch(logType){
            case BetterMixer.LogType.INFO:
                console.log(`[Better Mixer] ${msg}`);
                break;
            case BetterMixer.LogType.WARNING:
                console.warn(`[Better Mixer] ${msg}`);
                break;
            case BetterMixer.LogType.ERROR:
                console.error(`[Better Mixer] ${msg}`);
        }
    }

    postToContent(message){
        window.postMessage([SRC, message], '*');
    }

    getActiveChannel(index = 0){
        return this.activeChannels[index];
    }

    registerEventType(eventName){
        if (!(eventName in BetterMixer.Events)){
            BetterMixer.Events[eventName] = Object.keys(BetterMixer.Events).length;
            this._events.push([]);
        }
        else{
            this.log(`${eventName} is already an event!`, BetterMixer.LogType.WARNING);
        }
    }

    addEventListener(eventType, callback){
        this._events[eventType].push(callback);
    }

    removeEventListener(eventType, callback){
        if (eventType >= Object.keys(BetterMixer.Events).length){
            this.log(`Event ${eventType} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        let index = this._events[eventType].indexOf(callback);
        if (index == -1){
            this.log("That event listener does not exist!", BetterMixer.LogType.WARNING);
            return;
        }

        this._events[eventType].splice(index, 1);
    }

    dispatchEvent(eventType, data, sender){
        let event = {
            event: eventType,
            sender: sender,
            data: data
        };

        if (eventType >= Object.keys(BetterMixer.Events).length){
            this.log(`Event ${eventType} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        this._events[eventType].forEach(handler => handler(event));
    }

    dispatchGather(eventType, data, sender){
        let event = {
            event: eventType,
            sender: sender,
            data: data
        };

        let collected = [];
        if (eventType >= Object.keys(BetterMixer.Events).length){
            this.log(`Event ${eventType} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        this._events[eventType].forEach(handler => collected.push(handler(event)));
        return collected;
    }
}

/**
 * @enum {number}
 */
BetterMixer.LogType = Object.freeze({
    INFO: 0,
    WARNING: 1,
    ERROR: 2
});

/**
 * @enum {number}
 */
BetterMixer.Events = {
    ON_LOAD: 0,
    ON_CHANNEL_LOAD: 1,
    ON_CHAT_LOAD: 2,
    ON_USER_LOAD: 3,
    ON_MESSAGE: 4,
    ON_DIALOG_OPEN: 5,

    GATHER_EMOTES: 6
};

BetterMixer.instance = new BetterMixer();
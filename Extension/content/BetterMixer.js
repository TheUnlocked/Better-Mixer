import "../lib/js/jquery-3.3.1.min.js";
import "../lib/js/jquery.initialize.min.js";

import FFZAddon from "./Addons/FFZ/FFZAddon.js";
//import GameWispAddon from "./Addons/GameWisp/GameWispAddon.js";
import ConfigurationManager from "./Configs/ConfigurationManager.js";
import StylesheetToggleConfig from "./Configs/StylesheetToggleConfig.js";
import Channel from "./Channel.js";
import Patcher from "./Patcher.js";
import User from "./User.js";
import Badge from "./Badge.js";
import BTTVAddon from "./Addons/BTTV/BTTVAddon.js";
import BrowseFiltersConfig from "./Configs/BrowseFiltersConfig.js";
import ColorConfig from "./Configs/ColorConfig.js";

let SRC = document.getElementById('BetterMixer-module').src;
let BASE_URL = SRC.split('/').slice(0, -2).join('/') + '/';

export default class BetterMixer {
    constructor(){

        this.log("Base loaded.");

        this.configuration = new ConfigurationManager(this);
        this.ffz = new FFZAddon(this);
        this.bttv = new BTTVAddon(this);
        //this.gameWisp = new GameWispAddon(this);
        this.activeChannels = [];

        this._events = [];
        for (let _ in BetterMixer.Events){
            this._events.push([]);
        }

        $.ajax({
            url: `https://mixer.com/api/v1/users/current`,
            dataType: 'json',
            async: false,
            success: data => {
                this.user = new User(data);
            }
        });

        // Reload on page change
        (function(history){
            var pushState = history.pushState;
            history.pushState = function(state) {
                if (typeof history.onpushstate == "function") {
                    history.onpushstate({state: state});
                }
        
                let ret = pushState.apply(history, arguments);

                setTimeout(() => BetterMixer.instance.reload(), 0);

                return ret;
            };
            window.onpopstate = e => BetterMixer.instance.reload();
        })(window.history);

        this.injectStylesheet("lib/css/inject.css");

        let botColorConfig = new ColorConfig(
            'botcolor', 'Bot Color', '', '#d37110');
        botColorConfig.update = function() {
            $('.bettermixer-role-bot').css('color', this._state);
        };
        this.configuration.registerConfig(botColorConfig);

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/hideanimatedemotes.css"),
            'show_emotes_animated', 'Show Animated Emotes', '', true, false));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/movebadges.css"),
            'move_badges', 'Show Badges Before Username', '', true, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/hideavatars.css"),
            'hide_avatars', 'Hide Avatars', '', false, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/hidechatresizer.css"),
            'hide_chat_resizer', 'Disable Chat Resizer', '', false, true));

        this.configuration.registerConfig(new BrowseFiltersConfig());

        setTimeout(() => this.reload(), 0);

        window.onbeforeunload = () => {
            for (let channel of this.activeChannels){
                channel.unload();
            }
        };

        let creatorBadge = new Badge("Better Mixer Creator", "https://i.imgur.com/HfmDsUC.png", "Creator of the Better Mixer Chrome extension.");

        this.addEventListener(BetterMixer.Events.GATHER_BADGES, event => event.data.user.username == "Unlocked" ? creatorBadge : undefined);

        this.patcher = new Patcher(this);

        this.addEventListener(BetterMixer.Events.ON_CHAT_LOAD, () => {
            BetterMixer.ClassNames.BADGE = "badge__" + $('style').filter((_, element) => element.innerHTML.includes('.badge__'))[0].innerHTML.split('.badge__')[1].split('{')[0].trim();
        });
    }

    reload(){
        let page = window.location.pathname.substring(1).toLowerCase();

        this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);

        if (page == 'me/bounceback'){
            this._page = "";
            setTimeout(() => this.reload(), 100);
            return;
        }

        if (page == 'browse/all' || page.startsWith('dashboard') || page == "pro"){
            this.log(`This is not a user page.`);
            return;
        }

        if (page.startsWith('embed/chat/')){
            page = page.substring(11);
            this.log(`Chat is either in a popout or embedded window.`);
        }

        page = page.match(/^[a-z0-9_]+/i);

        if (!page){
            this._page = "";
            return;
        }

        page = page[0];

        if (page == this._page){
            return;
        }

        this._page = page;

        this.log(`Switched to page '${this._page}'`);

        for (let channel of this.activeChannels){
            channel.unload();
        }
        this.activeChannels = [];

        let mainChannel = new Channel(this, this._page);
        if (mainChannel.id){
            this.activeChannels.push(mainChannel);
        }

        let chatTabBar = document.querySelector('b-channel-chat-tabs>bui-tab-bar');

        if (chatTabBar){

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

        this._events[eventType].forEach(handler => {
            try {
                handler(event);
            }
            catch(error){
                this.log(error.stack, BetterMixer.LogType.ERROR);
            }
        });
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

        this._events[eventType].forEach(handler => {
            try {
                let result = handler(event);
                if (result){
                    collected.push(result);
                }
            }
            catch(error){
                console.error(error);
            }
        });
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
    ON_EMOTES_DIALOG_OPEN: 5,
    ON_SETTINGS_DIALOG_OPEN: 6,
    ON_PAGE_LOAD: 7,

    GATHER_EMOTES: 8,
    GATHER_BADGES: 9,
};

BetterMixer.ClassNames = {
    
};

BetterMixer.instance = new BetterMixer();
window.BetterMixer = BetterMixer;
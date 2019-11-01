import "../lib/js/jquery-3.4.1.slim.min.js";
import "../lib/js/jquery.initialize.min.js";

import TwitchAddon from "./Addons/Twitch/TwitchAddon.js";
import FFZAddon from "./Addons/FFZ/FFZAddon.js";
import BTTVAddon from "./Addons/BTTV/BTTVAddon.js";
//import GameWispAddon from "./Addons/GameWisp/GameWispAddon.js";
import ConfigurationManager from "./Configs/ConfigurationManager.js";
import StylesheetToggleConfig from "./Configs/StylesheetToggleConfig.js";
import Channel from "./Channel.js";
import Patcher from "./Patcher.js";
import User from "./User.js";
import Badge from "./Badge.js";
import BrowseFiltersConfig from "./Configs/BrowseFiltersConfig.js";
import ColorConfig from "./Configs/ColorConfig.js";
import BotDetectionConfig from "./Configs/BotDetectionConfig.js";
import StringConfig from "./Configs/StringConfig.js";
import { requestJson } from "./Util.js";

let SRC = document.getElementById('BetterMixer-module').src;
let BASE_URL = SRC.split('/').slice(0, -2).join('/') + '/';

export default class BetterMixer {
    constructor(){

        this.log("Base loaded.");

        this._events = [];
        for (let _ in BetterMixer.Events){
            this._events.push([]);
        }

        this.configuration = new ConfigurationManager(this);
        this.twitch = new TwitchAddon(this);
        this.bttv = new BTTVAddon(this);
        this.ffz = new FFZAddon(this);
        //this.gameWisp = new GameWispAddon(this);
        this.activeChannels = [];

        this.loadUser();

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

        this.injectStylesheet("lib/css/inject.css").disabled = false;

        let botColorDetectionConfig = new BotDetectionConfig();
        let botColorRegexConfig = new StringConfig(
            'botcolor_regex', 'Bot Username RegExp', '', 'Bot(?![a-z])|bot$');
        Object.defineProperty(botColorRegexConfig, 'hidden', { get: () => botColorDetectionConfig.state !== "custom" });
        let botColorConfig = new ColorConfig('botcolor', 'Bot Color', '', '#d37110');
        Object.defineProperty(botColorConfig, 'hidden', { get: () => botColorDetectionConfig.state === "off" });
        botColorConfig.update = () => {
            document.querySelectorAll('.bettermixer-role-bot').forEach(element => {
                element.style.color = this._state;
            });
        };
        this.configuration.registerConfig(botColorDetectionConfig);
        this.configuration.registerConfig(botColorRegexConfig);
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

        // BetterMixer.ClassNames
        this.addEventListener(BetterMixer.Events.ON_CHAT_FINISH_LOAD, () => {
            let badgeElementTimeout = () => {
                const badgeElement = [...document.querySelectorAll('style')].filter(element => element.innerHTML.includes('.badge__'))[0];
                if (!badgeElement){
                    setTimeout(badgeElementTimeout, 100);
                    return;
                }
                BetterMixer.ClassNames.BADGE = "badge__" +  badgeElement.innerHTML.split('.badge__')[1].split('{')[0].trim();
            }
            badgeElementTimeout();

            if (!BetterMixer.ClassNames.TEXTITEM){
                fetch(document.querySelector('script[src*="main."]').src).then(x => x.text()).then(x => {
                    let index = x.indexOf('textItem_');
                    BetterMixer.ClassNames.TEXTITEM = x.slice(index, index + 14)
                });
            }
        });
    }

    async loadUser(){
        try {
            const data = await requestJson('https://mixer.com/api/v1/users/current');
            this.user = new User(data);
        } catch(err){
            // do nothing?
        }
    }

    get isEmbeddedWindow(){
        return this._embedded;
    }
    get isUserPage(){
        return this._userPage;
    }

    reload(){
        let page = window.location.pathname.substring(1).toLowerCase();

        if (page == 'me/bounceback'){
            this._page = "";
            setTimeout(() => this.reload(), 100);
            return;
        }

        this._userPage = !(page == 'browse/all' || page.startsWith('dashboard') || page == "pro");
        if (!this._userPage){
            this.log(`This is not a user page.`);
            this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);
            return;
        }

        this._embedded = page.startsWith('embed/chat/');
        if (this._embedded){
            page = page.substring(11);
            this.log(`Chat is either in a popout or embedded window.`);
        }

        page = page.match(/^[a-z0-9_-]+/i);

        if (!page){
            this._page = "";
            this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);
            return;
        }

        page = page[0];

        if (page == this._page){
            this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);
            return;
        }

        this._page = page;
        this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);

        this.log(`Switched to page '${this._page}'`);

        if (this._chatObserver){
            this._chatObserver.disconnect();
        }

        for (let channel of this.activeChannels){
            channel.unload();
        }
        this.activeChannels = [];

        let mainChannel = new Channel(this, this._page);
        if (mainChannel.id){
            this.activeChannels.push(mainChannel);
        }
        this.focusedChannel = mainChannel;

        let loaded = false;
        const reloadChat = element => {
            loaded = true;
            let chatTabBar = document.querySelector('b-channel-chat-tabs>bui-tab-bar');

            if (chatTabBar){
                let thisChannelButton = chatTabBar.children[0];
                let otherChannelButton = chatTabBar.children[1];
                let selectedButton = thisChannelButton.querySelector('.bui-tab-underline') ? thisChannelButton : otherChannelButton;
                console.log(selectedButton);
                if (selectedButton === thisChannelButton || window.location.search.startsWith('?vod=')){
                    this.focusedChannel = mainChannel;
                    this.dispatchEvent(BetterMixer.Events.ON_CHAT_START_LOAD, {channel: mainChannel, element: element}, this);
                }
                else{
                    let secondChannel = new Channel(this, otherChannelButton.innerText.toLowerCase());
                    if (this.activeChannels.length > 1){
                        this.activeChannels.pop().unload();
                    }
                    this.activeChannels.push(secondChannel);
                    this.focusedChannel = secondChannel;
                    this.dispatchEvent(BetterMixer.Events.ON_CHAT_START_LOAD, {channel: secondChannel, element: element}, this);
                }
            }
            else{
                this.focusedChannel = mainChannel;
                this.dispatchEvent(BetterMixer.Events.ON_CHAT_START_LOAD, {channel: mainChannel, element: element}, this);
            }
        }

        let chatObserverLoop = () => {
            if (!document.querySelector('b-channel-chat-section')){
                setTimeout(chatObserverLoop, 100);
                return;
            }

            this._chatObserver = $.initialize('b-chat-client-host-component [class*="chatContainer"]', (_, element) => {
                reloadChat(element);
            }, { target: document.querySelector('b-channel-chat-section').parentElement });
            if (!loaded && document.querySelector('b-chat-client-host-component')){
                reloadChat(document.querySelector('b-chat-client-host-component').children[0]);
            }
        }
        chatObserverLoop();
    }

    injectStylesheet(file){
        let injection;
        injection = document.createElement('link');
        injection.rel = 'stylesheet';
        injection.href = BASE_URL + file;
        injection.disabled = true;
        document.head.appendChild(injection);
        return injection;
    }

    log(msg, logType = BetterMixer.LogType.INFO){
        switch(logType){
            case BetterMixer.LogType.INFO:
                console.log(`[Better Mixer] ${msg}`);
                break;
            case BetterMixer.LogType.WARN:
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
            BetterMixer.Events[eventName] = BetterMixer.Events.length;
            this._events.push([]);
            return BetterMixer.Events[eventName];
        }
        else{
            this.log(`${eventName} is already an event!`, BetterMixer.LogType.WARN);
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
            this.log("That event listener does not exist!", BetterMixer.LogType.WARN);
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
    WARN: 1,
    /* Deprecated - DO NOT USE */ WARNING: 1,
    ERROR: 2
});

/**
 * @enum {number}
 */
BetterMixer.Events = {
    ON_LOAD: 0,
    ON_CHANNEL_LOAD: 1,
    ON_CHAT_FINISH_LOAD: 2,
    ON_CHAT_START_LOAD: 10,
    ON_USER_LOAD: 3,
    ON_MESSAGE: 4,
    ON_EMOTES_DIALOG_OPEN: 5,
    ON_SETTINGS_DIALOG_OPEN: 6,
    ON_PAGE_LOAD: 7,
    ON_EMOTES_ADDED: 11,

    GATHER_EMOTES: 8,
    GATHER_BADGES: 9,
};

BetterMixer.ClassNames = {
    
};

BetterMixer.instance = new BetterMixer();
window.BetterMixer = BetterMixer;

import TwitchAddon from "./Addons/Twitch/TwitchAddon.js";
import FFZAddon from "./Addons/FFZ/FFZAddon.js";
import BTTVAddon from "./Addons/BTTV/BTTVAddon.js";
//import GameWispAddon from "./Addons/GameWisp/GameWispAddon.js";
import ConfigurationManager from "./Configs/ConfigurationManager.js";
import StylesheetToggleConfig from "./Configs/StylesheetToggleConfig.js";
import Channel from "./Channel.js";
import Patcher from "./Patchers/Patcher.js";
import User from "./User.js";
import Badge from "./Badge.js";
import BrowseFiltersConfig from "./Configs/BrowseFiltersConfig.js";
import ColorConfig from "./Configs/ColorConfig.js";
import BotDetectionConfig from "./Configs/BotDetectionConfig.js";
import StringConfig from "./Configs/StringConfig.js";
import { fetchJson, waitFor, observeNewElements } from "./Utility/Util.js";

const SRC = document.getElementById('BetterMixer-module').src;
const BASE_URL = SRC.split('/').slice(0, -2).join('/') + '/';

export default class BetterMixer {
    constructor() {

        this.log("Base loaded.");

        this._events = [];
        for (const _ in BetterMixer.Events) {
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
        /* eslint-disable prefer-arrow/prefer-arrow-functions */
        (function(history) {
            const pushState = history.pushState;
            history.pushState = function(state) {
                if (typeof history.onpushstate === "function") {
                    history.onpushstate({state: state});
                }
        
                // eslint-disable-next-line prefer-rest-params
                const ret = pushState.apply(history, arguments);

                BetterMixer.instance.reload();

                return ret;
            };
            window.onpopstate = e => BetterMixer.instance.reload();
        })(window.history);
        /* eslint-enable prefer-arrow/prefer-arrow-functions */

        this.injectStylesheet("lib/css/inject.css").disabled = false;

        const botColorDetectionConfig = new BotDetectionConfig();
        const botColorRegexConfig = new StringConfig(
            'botcolor_regex', 'Bot Username RegExp', '', 'Bot(?![a-z])|bot$');
        Object.defineProperty(botColorRegexConfig, 'hidden', { get: () => botColorDetectionConfig.state !== "custom" });
        const botColorConfig = new ColorConfig('botcolor', 'Bot Color', '', '#d37110');
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
            this.injectStylesheet("lib/css/hideprogression.css"),
            'hide_progression', 'Hide Fan Progression', '', false, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet("lib/css/hidechatresizer.css"),
            'hide_chat_resizer', 'Disable Chat Resizer', '', false, true));

        this.configuration.registerConfig(new BrowseFiltersConfig());

        this.reload();

        window.onbeforeunload = () => {
            for (const channel of this.activeChannels) {
                channel.unload();
            }
        };

        fetchJson('https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/badges/badges.json').then(data => {
            const badges = {};
            for (const badge of data.badges) {
                badges[badge.id] = new Badge(badge.name, badge.src);
            }
            this.addEventListener(BetterMixer.Events.GATHER_BADGES, event => {
                const userBadges = [];

                for (const group of data.groups) {
                    if (group.members.includes(event.data.user.username.toLowerCase())) {
                        userBadges.push(...(group.badges.map(id => badges[id])));
                    }
                }

                return userBadges;
            });
        });

        this.patcher = new Patcher(this);

        // BetterMixer.ClassNames
        this.addEventListener(BetterMixer.Events.ON_CHAT_FINISH_LOAD, async () => {
            let badgeElement;
            await waitFor(() => badgeElement = [...document.querySelectorAll('style')].filter(element => element.innerHTML.includes('.badge__'))[0]);

            BetterMixer.ClassNames.BADGE = "badge__" +  badgeElement.innerHTML.split('.badge__')[1].split('{')[0].trim();

            if (!BetterMixer.ClassNames.TEXTITEM) {
                const scriptText = await (await fetch(document.querySelector('script[src*="main."]').src)).text();
                const index = scriptText.indexOf('textItem_');
                // eslint-disable-next-line require-atomic-updates
                BetterMixer.ClassNames.TEXTITEM = scriptText.slice(index, index + 14);
            }
        });
    }

    async loadUser() {
        try {
            const data = await fetchJson('https://mixer.com/api/v1/users/current');
            this.user = new User(data);
        } catch (err) {
            // do nothing?
        }
    }

    get isEmbeddedWindow() {
        return this._embedded;
    }
    get isUserPage() {
        return this._userPage;
    }

    async reload() {
        let page;

        await waitFor(() => (page = window.location.pathname.substring(1).toLowerCase()) !== 'me/bounceback');

        this._userPage = !(page === 'browse/all' || page.startsWith('dashboard') || page === "pro");
        if (!this._userPage) {
            this.log(`This is not a user page.`);
            this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);
            return;
        }

        this._embedded = page.startsWith('embed/chat/');
        if (this._embedded) {
            page = page.substring(11);
            this.log(`Chat is either in a popout or embedded window.`);
        }

        page = page.match(/^[a-z0-9_-]+/i);

        if (!page) {
            this._page = "";
            this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);
            return;
        }

        page = page[0];

        // if (page === this._page) {
        //     this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);
        //     return;
        // }

        this._page = page;
        this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);

        this.log(`Switched to page '${this._page}'`);

        if (this._chatObserver) {
            this._chatObserver.disconnect();
        }

        for (const channel of this.activeChannels) {
            channel.unload();
        }
        this.activeChannels = [];

        const mainChannel = new Channel(this, this._page);
        this.activeChannels.push(mainChannel);
        this.focusedChannel = mainChannel;

        let loaded = false;
        const reloadChat = element => {
            loaded = true;
            const chatTabBar = document.querySelector('b-channel-chat-tabs>bui-tab-bar');

            if (chatTabBar) {
                const thisChannelButton = chatTabBar.children[0];
                const otherChannelButton = chatTabBar.children[1];
                const selectedButton = thisChannelButton.querySelector('.bui-tab-underline') ? thisChannelButton : otherChannelButton;
                if (selectedButton === thisChannelButton || window.location.search.startsWith('?vod=')) {
                    this.focusedChannel = mainChannel;
                    this.dispatchEvent(BetterMixer.Events.ON_CHAT_START_LOAD, {channel: mainChannel, element: element}, this);
                }
                else {
                    const secondChannel = new Channel(this, otherChannelButton.innerText.toLowerCase());
                    if (this.activeChannels.length > 1) {
                        this.activeChannels.pop().unload();
                    }
                    this.activeChannels.push(secondChannel);
                    this.focusedChannel = secondChannel;
                    secondChannel.loadChat(element);
                }
            }
            else {
                this.focusedChannel = mainChannel;
                mainChannel.loadChat(element);
            }
        };

        await waitFor(() => document.querySelector('b-channel-chat-section'));

        this._chatObserver = observeNewElements('b-chat-client-host-component [class*="chatContainer"]',
            document.querySelector('b-channel-chat-section').parentElement,
            element => {
            reloadChat(element);
        });
        if (!loaded && document.querySelector('b-chat-client-host-component')) {
            reloadChat(document.querySelector('b-chat-client-host-component').children[0]);
        }
    }

    injectStylesheet(file) {
        const injection = document.createElement('link');
        injection.rel = 'stylesheet';
        injection.href = BASE_URL + file;
        injection.disabled = true;
        document.head.appendChild(injection);
        return injection;
    }

    log(msg, logType = BetterMixer.LogType.INFO) {
        switch (logType) {
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

    postToContent(message) {
        window.postMessage([SRC, message], '*');
    }

    getActiveChannel(index = 0) {
        return this.activeChannels[index];
    }

    registerEventType(eventName) {
        if (!(eventName in BetterMixer.Events)) {
            BetterMixer.Events[eventName] = BetterMixer.Events.length;
            this._events.push([]);
            return BetterMixer.Events[eventName];
        }
        else {
            this.log(`${eventName} is already an event!`, BetterMixer.LogType.WARN);
        }
    }

    addEventListener(eventType, callback) {
        this._events[eventType].push(callback);
    }

    removeEventListener(eventType, callback) {
        if (eventType >= Object.keys(BetterMixer.Events).length) {
            this.log(`Event ${eventType} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        const index = this._events[eventType].indexOf(callback);
        if (index === -1) {
            this.log("That event listener does not exist!", BetterMixer.LogType.WARN);
            return;
        }

        this._events[eventType].splice(index, 1);
    }

    dispatchEvent(eventType, data, sender) {
        const event = {
            event: eventType,
            sender: sender,
            data: data
        };

        if (eventType >= Object.keys(BetterMixer.Events).length) {
            this.log(`Event ${eventType} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        this._events[eventType].forEach(handler => {
            try {
                handler(event);
            }
            catch (error) {
                this.log(error.stack, BetterMixer.LogType.ERROR);
            }
        });
    }

    dispatchGather(eventType, data, sender) {
        const event = {
            event: eventType,
            sender: sender,
            data: data
        };

        const collected = [];
        if (eventType >= Object.keys(BetterMixer.Events).length) {
            this.log(`Event ${eventType} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        this._events[eventType].forEach(handler => {
            try {
                const result = handler(event);
                if (result) {
                    collected.push(result);
                }
            }
            catch (error) {
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

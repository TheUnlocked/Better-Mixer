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
import EmptyConfig from "./Configs/EmptyConfig.js";
import ColorConfig from "./Configs/ColorConfig.js";
import BotDetectionConfig from "./Configs/BotDetectionConfig.js";
import StringConfig from "./Configs/StringConfig.js";
import { fetchJson, waitFor, observeNewElements } from "./Utility/Promise.js";
import DropdownConfig from "./Configs/DropdownConfig.js";
import { BetterMixerEvent, EventMap, GatherMap } from "./BetterMixerEvent.js";

const COMPILE_TARGET = __COMPILER_INLINE('target');
const SRC = COMPILE_TARGET === 'script' ? 'better_mixer_user_script' : (document.getElementById('BetterMixer-module') as HTMLImageElement).src;
const BASE_URL = SRC.split('/').slice(0, -2).join('/') + '/';

export default class BetterMixer {
    _events: {[eventName: string]: Function[]};
    configuration: ConfigurationManager;
    twitch: TwitchAddon;
    bttv: BTTVAddon;
    ffz: FFZAddon;
    activeChannels: Channel[];
    patcher: Patcher;
    user?: User;
    focusedChannel?: Channel;

    private _embedded?: any;
    private _userPage?: any;
    private _page?: string;
    private _chatObserver?: MutationObserver;
    private _state: any;

    constructor() {

        this.log("Base loaded.");

        this._events = {};
        
        for (const eventName of [
            'load',
            'beforeChannelLoad',
            'channelLoad',
            'chatFinishLoad',
            'chatStartLoad',
            'userLoad',
            'chatMessage',
            'emotesDialogOpen',
            'settingsDialogOpen',
            'pageLoad',
            'emotesAdded',
            
            'gatherEmotes',
            'gatherBadges',
        ]) {
            this._events[eventName] = [];
        }

        this.configuration = new ConfigurationManager(this);
        this.twitch = new TwitchAddon(this);
        this.bttv = new BTTVAddon(this);
        this.ffz = new FFZAddon(this);
        this.activeChannels = [];

        this.loadUser();

        // Reload on page change
        (history => {
            const pushState = history.pushState;
            history.pushState = (state: any, title: string, url?: string | null) => {
                const ret = pushState.apply(history, [state, title, url]);

                BetterMixer.instance.reload();

                return ret;
            };
            window.onpopstate = (e: PopStateEvent) => BetterMixer.instance.reload();
        })(window.history);

        this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/inject.css')).disabled = false;

        const botColorDetectionConfig = new BotDetectionConfig();
        const botColorRegexConfig = new StringConfig(
            'botcolor_regex', 'Bot Username RegExp', '', 'Bot(?![a-z])|[Bb][Oo][Tt]$');
        Object.defineProperty(botColorRegexConfig, 'hidden', { get: () => botColorDetectionConfig.state !== "custom" });
        const botColorConfig = new ColorConfig('botcolor', 'Bot Color', '', '#d37110');
        Object.defineProperty(botColorConfig, 'hidden', { get: () => botColorDetectionConfig.state === "off" });
        botColorConfig.update = () => {
            document.querySelectorAll('.bettermixer-role-bot').forEach(element => {
                (element as HTMLElement).style.color = this._state;
            });
        };
        this.configuration.registerConfig(botColorDetectionConfig);
        this.configuration.registerConfig(botColorRegexConfig);
        this.configuration.registerConfig(botColorConfig);

        const linkPreviewConfig = new DropdownConfig(
            'BETA_link_preview', 'Show Link Previews', '', {
                'off': 'Disable',
                'last': 'Show Last Only',
                'all': 'Show All'
            }, 'off'
        );
        Object.defineProperty(linkPreviewConfig, 'superText', { get: () => "BETA" });
        this.configuration.registerConfig(linkPreviewConfig);

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/movebadges.css')),
            'move_badges', 'Show Badges Before Username', '', true, true));

        const markdownConfig = new StylesheetToggleConfig(
            this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/showmarkdown.css')),
            'show_markdown', 'Render Markdown Effects', '', true, true);
        this.configuration.registerConfig(markdownConfig);

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/hideanimatedemotes.css')),
            'show_emotes_animated', 'Show Animated Emotes', '', true, false));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/hideavatars.css')),
            'hide_avatars', 'Hide Avatars', '', false, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/hideprogression.css')),
            'hide_progression', 'Hide Fan Progression', '', false, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/hideconfetti.css')),
            'hide_confetti', 'Hide Confetti-like Effects', '', false, true));

        this.configuration.registerConfig(new StylesheetToggleConfig(
            this.injectStylesheet(__COMPILER_INLINE('stylesheet', 'lib/css/hidechatresizer.css')),
            'hide_chat_resizer', 'Disable Chat Resizer', '', false, true));

        this.configuration.registerConfig(new EmptyConfig('browse_filters', ''));
        this.configuration.registerConfig(new EmptyConfig('mixplay_start_closed', false));

        this.reload();

        window.onbeforeunload = () => {
            for (const channel of this.activeChannels) {
                channel.unload();
            }
        };

        fetchJson('https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/badges/badges.json').then((data: {
            badges: {
                id: string;
                name: string;
                src: string;
                description: string;
            }[];
            groups: {
                badges: string[];
                members: string[];
            }[];
        }) => {
            const badges: {[badgeId: string]: Badge} = {};
            for (const badge of data.badges) {
                badges[badge.id] = new Badge(badge.name, badge.src);
            }
            this.addEventListener('gatherBadges', event => {
                
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
        this.addEventListener('chatFinishLoad', async () => {
            let badgeElement: HTMLElement = undefined!;
            await waitFor(() => badgeElement = [...document.querySelectorAll('style')].filter(element => element.innerHTML.includes('.badge__'))[0]);

            BetterMixer.ClassNames.BADGE = "badge__" +  badgeElement.innerHTML.split('.badge__')[1].split('{')[0].trim();

            if (!BetterMixer.ClassNames.TEXTITEM) {
                const script = document.querySelector('script[src*="main."]') as HTMLScriptElement;
                if (script) {
                    const scriptText = await (await fetch(script.src)).text();
                    const index = scriptText.indexOf('textItem_');
                    // eslint-disable-next-line require-atomic-updates
                    BetterMixer.ClassNames.TEXTITEM = scriptText.slice(index, index + 14);
                }
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
        let page: string = undefined!;

        await waitFor(() => (page = window.location.pathname.substring(1).toLowerCase()) !== 'me/bounceback');

        this._userPage = !(page === 'browse/all' || page.startsWith('dashboard') || page === "pro");
        if (!this._userPage) {
            this.log(`This is not a user page.`);
            this.dispatchEvent('pageLoad', page, this);
            return;
        }

        this._embedded = page.startsWith('embed/chat/');
        if (this._embedded) {
            page = page.substring(11);
            this.log(`Chat is either in a popout or embedded window.`);
        }

        const pageRegexMatches = page.match(/^[a-z0-9_-]+/i);

        if (!pageRegexMatches) {
            this._page = "";
            this.dispatchEvent('pageLoad', page, this);
            return;
        }

        page = pageRegexMatches[0];

        // if (page === this._page) {
        //     this.dispatchEvent(BetterMixer.Events.ON_PAGE_LOAD, page, this);
        //     return;
        // }

        this._page = page;
        this.dispatchEvent('pageLoad', page, this);

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
        const reloadChat = (element: HTMLElement) => {
            loaded = true;
            const chatTabBar = document.querySelector('b-channel-chat-tabs>bui-tab-bar');

            if (chatTabBar) {
                const thisChannelButton = chatTabBar.children[0];
                const otherChannelButton = chatTabBar.children[1];
                const selectedButton = thisChannelButton.querySelector('.bui-tab-underline') ? thisChannelButton : otherChannelButton;
                if (selectedButton === thisChannelButton || window.location.search.startsWith('?vod=')) {
                    this.focusedChannel = mainChannel;
                    // this.dispatchEvent('chatStartLoad', {channel: mainChannel, element: element}, this);
                }
                else {
                    const secondChannel = new Channel(this, (otherChannelButton as HTMLElement).innerText.toLowerCase());
                    if (this.activeChannels.length > 1) {
                        this.activeChannels.pop()!.unload();
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

        if (!this._embedded) {
            await waitFor(() => document.querySelector('b-channel-chat-section'));

            this._chatObserver = observeNewElements('b-chat-client-host-component [class*="chatContainer"]',
                document.querySelector('b-channel-chat-section')!.parentElement!,
                element => reloadChat(element)
            );
            if (!loaded && document.querySelector('b-chat-client-host-component')) {
                reloadChat(document.querySelector('b-chat-client-host-component')!.children[0] as HTMLElement);
            }
        }
        else {
            await waitFor(() => document.querySelector('b-chat-client-host-component [class*="chatContainer"]'));
            reloadChat(document.querySelector('b-chat-client-host-component [class*="chatContainer"]') as HTMLElement);
        }
    }

    private injectStylesheet(file: string) {
        let injection: HTMLLinkElement | HTMLStyleElement;
        if (COMPILE_TARGET === 'script') {
            injection = document.createElement('style');
            injection.innerText = file;
            document.head.appendChild(injection);
            injection.disabled = true;
        }
        else {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = BASE_URL + file;
            injection = link;
            injection.disabled = true;
            document.head.appendChild(injection);
        }
        return injection;
    }

    log(msg: string, logType = BetterMixer.LogType.INFO) {
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

    postToContent(message: {message: string; data?: any}) {
        window.postMessage([SRC, message], '*');
    }

    getActiveChannel(index = 0) {
        return this.activeChannels[index];
    }

    registerEventType(eventName: string) {
        if (Object.keys(this._events).includes(eventName)) {
            this._events[eventName] = [];
        }
        else {
            this.log(`${eventName} is already an event!`, BetterMixer.LogType.WARN);
        }
    }

    addEventListener<Event extends keyof EventMap>(
        eventType: Event,
        callback: (event: BetterMixerEvent<EventMap[Event]>) => void
    ): (event: BetterMixerEvent<EventMap[Event]>) => void;
    addEventListener<Event extends keyof GatherMap>(
        eventType: Event,
        callback: (event: BetterMixerEvent<GatherMap[Event][0]>) => GatherMap[Event][1] | undefined
    ): (event: BetterMixerEvent<GatherMap[Event][0]>) => GatherMap[Event][1];
    /**
     * 
     * @returns The function put in `callback`
     */
    addEventListener(eventType: EventType, callback: (event: BetterMixerEvent<any>) => any): (event: BetterMixerEvent<any>) => any {
        if (!Object.keys(this._events).includes(eventType)) {
            this.log(`Event ${eventType} does not exist.`, BetterMixer.LogType.ERROR);
            return callback;
        }

        this._events[eventType].push(callback);
        return callback;
    }

    removeEventListener<Event extends keyof EventMap>(
        eventType: Event,
        callback: (event: BetterMixerEvent<EventMap[Event]>) => void
    ): void;
    removeEventListener<Event extends keyof GatherMap>(
        eventType: Event,
        callback: (event: BetterMixerEvent<GatherMap[Event][0]>) => GatherMap[Event][1] | undefined
    ): void;
    removeEventListener(eventType: EventType, callback: (event: BetterMixerEvent<any>) => any) {
        if (!Object.keys(this._events).includes(eventType)) {
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

    dispatchEvent<Event extends keyof EventMap>(
        eventType: Event,
        data:  EventMap[Event],
        sender: any
    ): void;
    dispatchEvent(eventType: EventType, data: any, sender: any) {
        const event = {
            event: eventType,
            sender: sender,
            data: data
        };

        if (!Object.keys(this._events).includes(eventType)) {
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

    dispatchGather<Event extends keyof GatherMap>(
        eventType: Event,
        data:  GatherMap[Event][0],
        sender: any
    ): GatherMap[Event][1][];
    dispatchGather(eventType: EventType, data: any, sender: any): any {
        const event = {
            event: eventType,
            sender: sender,
            data: data
        };

        const collected: any[] = [];
        if (!Object.keys(this._events).includes(eventType)) {
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

    static LogType = Object.freeze({
        INFO: 0,
        WARN: 1,
        /** @deprecated use `BetterMixer.LogType.WARN` instead */
        WARNING: 1,
        ERROR: 2
    });

    static ClassNames: {[className: string]: string} = {};

    static instance = new BetterMixer();
}

type EventType = string;

window.BetterMixer = BetterMixer;

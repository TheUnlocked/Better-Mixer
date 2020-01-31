import BetterMixer from "./BetterMixer.js";
import Chat from "./Chat.js";
import User from "./User.js";
import { fetchJson } from "./Utility/Promise.js";
import FFZChannel from "./Addons/FFZ/FFZChannel.js";
import BTTVChannel from "./Addons/BTTV/BTTVChannel.js";
import TwitchChannel from "./Addons/Twitch/TwitchChannel.js";

export default class Channel {
    plugin: BetterMixer;
    channelName: string;
    id?: number;
    owner?: User;
    name?: string;
    audience?: string;
    description?: string;
    partnered?: boolean;
    twitchChannel?: TwitchChannel;
    bttvChannel?: BTTVChannel;
    ffzChannel?: FFZChannel;
    chat?: Chat;
    channelSettings: {
        twitch?: {
            id?: number;
            name?: string;
        };
        bttv?: {
            globals?: boolean;
            sync?: boolean;
        };
        ffz?: {
            globals?: boolean;
            sync?: boolean;
        };
    } = {};

    constructor(plugin: BetterMixer, channelName: string) {
        this.plugin = plugin;
        this.channelName = channelName;
        this.plugin.dispatchEvent('beforeChannelLoad', this, this);
        this.init();
    }

    async init() {
        try {
            const data = await fetchJson(`https://mixer.com/api/v1/channels/${this.channelName}`);
            this.id = data.id;
            this.owner = new User(data.user);
            this.channelName = data.token;
            this.name = data.name;
            this.audience = data.audience;
            this.description = data.description;
            this.partnered = data.partnered;

            const channelSettingsElement: HTMLImageElement | null = new DOMParser().parseFromString(this.description!, "text/html").querySelector('img[alt^="!!better-mixer-desc-flags!!"]');
            if (channelSettingsElement) {
                try {
                    const parsed = JSON.parse(channelSettingsElement.alt.slice(27));
                    this.channelSettings = parsed;
                    this.plugin.log("Loaded description flags.", BetterMixer.LogType.INFO);
                }
                catch (error) {
                    this.plugin.log("This channel has corrupt description flags.", BetterMixer.LogType.WARN);
                    this.channelSettings = {};
                }
            }
            else {
                this.plugin.log("This channel has no description flags.", BetterMixer.LogType.INFO);
                this.channelSettings = {};
            }

            this.twitchChannel = this.plugin.twitch.getSync(this);
            if (this.twitchChannel) {
                this.bttvChannel = this.plugin.bttv.getSync(this.twitchChannel);
                this.ffzChannel = this.plugin.ffz.getSync(this.twitchChannel);
            }

            this.chat = new Chat(this);
            this.plugin.dispatchEvent('chatStartLoad', this.chat, this);
            this.plugin.dispatchEvent('channelLoad', this, this);
            this.plugin.log(`Loaded channel '${this.channelName}'`, BetterMixer.LogType.INFO);
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to get channel ${this.channelName}`, BetterMixer.LogType.ERROR);
        }
    }

    loadChat(element: HTMLElement) {
        if (this.chat) {
            this.chat.load(element);
        }
        else {
            const loader = this.plugin.addEventListener('chatStartLoad', e => {
                if (e.data === this.chat) {
                    e.data.load(element);
                    this.plugin.removeEventListener('chatStartLoad', loader);    
                }
            });
        }
    }

    unload() {
        this.chat && this.chat.unload();
        this.ffzChannel && this.ffzChannel.unload();
        this.bttvChannel && this.bttvChannel.unload();
        this.twitchChannel && this.twitchChannel.unload();
        // this.gameWispChannel && this.gameWispChannel.unload();
    }
}
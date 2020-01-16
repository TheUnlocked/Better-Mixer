import Emote from "../../Emote.js";
import BetterMixer from "../../BetterMixer.js";
import FFZAddon from "./FFZAddon.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import { fetchJson, waitFor } from "../../Utility/Util.js";
import Channel from "Extension/content/Channel.js";
import { GatherEmotesEvent, GatherEmotesResult } from "Extension/content/BetterMixerEvent.js";

export default class FFZChannel {
    ffz: FFZAddon;
    plugin: any;
    channel: Channel;
    twitch: TwitchChannel;
    emotes: EmoteSet;
    cancelLoad = false;
    
    private _gatherEmotes?: (event: GatherEmotesEvent) => GatherEmotesResult | undefined;

    constructor(parent: FFZAddon, channel: TwitchChannel) {
        this.ffz = parent;
        this.plugin = parent.plugin;
        this.channel = channel.channel;
        this.twitch = channel;
        this.emotes = new EmoteSet("FFZ Channel Emotes", 90);
        this.init();
    }

    async init() {
        if (!this.channel.channelSettings.ffz || this.channel.channelSettings.ffz.sync) {
            await waitFor(() => this.twitch.login);

            try {
                this._successHandler(await fetchJson(`https://api.frankerfacez.com/v1/room/${this.twitch.login}`));
            } catch (err) {
                if (this.cancelLoad) return;
                this.plugin.log(`${err.message}: Failed to load emotes from FFZ. Trying alternate method.`, BetterMixer.LogType.INFO);
                
                await this._loadAlternate();
            }
        }
    }

    private async _loadAlternate() {
        await waitFor(() => this.twitch.id);

        try {
            this._successHandler(await fetchJson(`https://api-test.frankerfacez.com/v1/room/id/${this.twitch.id}`));
        } catch (err) {
            if (this.cancelLoad) return;
            this.plugin.log(`${err.message}: Failed to load emotes from FFZ.`, BetterMixer.LogType.INFO);
        }
    }

    private _successHandler(data: {
        /* eslint-disable camelcase */
        room: unknown;
        sets: {[setName: string]: {
            id: number;
            _type: number;
            icon: string | null;
            title: string;
            css: string | null;
            emoticons: {
                id: number;
                name: string;
                height: number;
                width: number;
                public: boolean;
                hidden: boolean;
                modifier: boolean;
                offset: unknown;
                margins: unknown;
                css: unknown;
                owner: {
                    _id: number;
                    name: string;
                    display_name: string;
                };
                urls: {
                    1: string;
                    2: string | null;
                    4: string | null;
                };
                animated: boolean;
            }[];
        };};
        /* eslint-enable camelcase */
    }) {
        if (this.cancelLoad) {
            return;
        }
        for (const emoteSet in data.sets) {
            for (const emote of data.sets[emoteSet].emoticons) {
                let emoteUrl = emote.urls['4'];
                if (!emoteUrl)
                    emoteUrl = emote.urls['2'];
                if (!emoteUrl)
                    emoteUrl = emote.urls['1'];
                this.emotes.addEmote(new Emote(emote.name, emoteUrl, emote.width, emote.height));
            }
        }
        
        this._gatherEmotes = event => {
            if (event.data.channel === this.channel) {
                return this.emotes;
            }
        };

        this.plugin.addEventListener('gatherEmotes', this._gatherEmotes);
        this.plugin.dispatchEvent('emotesAdded', [this.emotes], this);

        this.plugin.log(`Synced ${this.channel.owner!.username} with FFZ emotes from ${this.twitch.login}.`, BetterMixer.LogType.INFO);
    } 

    unload() {
        this.cancelLoad = true;
        this._gatherEmotes && this.plugin.removeEventListener('gatherEmotes', this._gatherEmotes);
    }
}

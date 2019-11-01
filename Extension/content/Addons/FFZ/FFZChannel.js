import Emote from "../../Emote.js";
import BetterMixer from "../../BetterMixer.js";
import FFZAddon from "./FFZAddon.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import { requestJson } from "../../Util.js";

export default class FFZChannel{
    /**
     * @param {FFZAddon} parent 
     * @param {TwitchChannel} channel
     * @param {string} username 
     */
    constructor(parent, channel) {
        this.ffz = parent;
        this.plugin = parent.plugin;
        this.channel = channel.channel;
        this.twitch = channel;
        this.emotes = new EmoteSet("FFZ Channel Emotes", 90);
        this.init();
    }

    init(){
        if (!this.twitch.id){
            setTimeout(() => {
                this.plugin.log(`Retrying to load emotes from FFZ.`, BetterMixer.LogType.INFO);
                this.init();
            }, 100);
            return;
        }
        this._load();
    }

    async _load(){
        if (!this.channel.channelSettings.ffz || this.channel.channelSettings.ffz.sync){
            try {
                this._successHandler(await requestJson(`https://api.frankerfacez.com/v1/room/${this.twitch.login}`));
            } catch(err){
                if (this.cancelLoad) return;
                this.plugin.log(`${err.message}: Failed to load emotes from FFZ. Trying alternate method.`, BetterMixer.LogType.INFO);
                await this._loadAlternate();
            }
        }
    }

    async _loadAlternate(){
        try {
            this._successHandler(await requestJson(`https://api-test.frankerfacez.com/v1/room/id/${this.twitch.id}`));
        } catch(err){
            if (this.cancelLoad) return;
            this.plugin.log(`${err.message}: Failed to load emotes from FFZ.`, BetterMixer.LogType.INFO);
        }
    }

    _successHandler(data){
        if (this.cancelLoad){
            return;
        }
        for (let emoteSet in data.sets){
            for (let emote of data.sets[emoteSet].emoticons) {
                let emoteUrl = emote.urls['4'];
                if (!emoteUrl)
                    emoteUrl = emote.urls['2'];
                if (!emoteUrl)
                    emoteUrl = emote.urls['1'];
                this.emotes.addEmote(new Emote(emote.name, emoteUrl, emote.width, emote.height));
            }
        }
        
        this._gatherEmotes = event => {
            if (event.data.channel === this.channel){
                return this.emotes;
            }
        };

        this.plugin.addEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);
        this.plugin.dispatchEvent(BetterMixer.Events.ON_EMOTES_ADDED, [this.emotes], this);

        this.plugin.log(`Synced ${this.channel.owner.username} with FFZ emotes from ${this.twitch.login}.`, BetterMixer.LogType.INFO);
    } 

    unload(){
        this.cancelLoad = true;
        this._gatherEmotes && this.plugin.removeEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);
    }
}

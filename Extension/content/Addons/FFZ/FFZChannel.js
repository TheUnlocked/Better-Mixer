import Emote from "../../Emote.js";
import BetterMixer from "../../BetterMixer.js";
import FFZAddon from "./FFZAddon.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";

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
        this.emotes = new EmoteSet("FFZ Channel Emotes");

        let load = () => {
            if (!this.twitch.id){
                setTimeout(load, 100);
                return;
            }
            $.ajax({
                url: `https://api.frankerfacez.com/v1/room/${this.twitch.login}`,
                dataType: 'json',
                async: false,
                success: data => {
                    for (let emoteSet in data.sets) {
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
    
                    this.plugin.log(`Synced ${this.channel.owner.username} with FFZ emotes from ${this.twitch.login}.`, BetterMixer.LogType.INFO);
                },
                error: xhr => {
                    this.plugin.log(`${xhr.statusText}: Failed to load emotes from FFZ. Trying alternate method.`, BetterMixer.LogType.INFO);
                    $.ajax({
                        url: `https://api-test.frankerfacez.com/v1/room/id/${this.twitch.id}`,
                        dataType: 'json',
                        async: false,
                        success: data => {
                            for (let emoteSet in data.sets) {
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
            
                            this.plugin.log(`Synced ${this.channel.owner.username} with FFZ emotes from ${this.twitch.login}.`, BetterMixer.LogType.INFO);
                        },
                        error: xhr => this.plugin.log(`${xhr.statusText}: Failed to load emotes from FFZ.`, BetterMixer.LogType.INFO)
                    });
                }
            });
        };
        load();
    }

    unload(){
        this.plugin.removeEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);
    }
}

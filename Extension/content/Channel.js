import BetterMixer from "./BetterMixer.js";
import Chat from "./Chat.js";
import User from "./User.js";
import { fetchJson } from "./Utility/Util.js";

export default class Channel {
    /**
     * @param {BetterMixer} plugin 
     * @param {string} channelName 
     */
    constructor(plugin, channelName){
        this.plugin = plugin;
        this.channelName = channelName;
        this.init();
    }

    async init(){
        try {
            const data = await fetchJson(`https://mixer.com/api/v1/channels/${this.channelName}`);
            this.id = data.id;
            this.owner = new User(data.user);
            this.name = data.name;
            this.audience = data.audience;
            this.description = data.description;
            this.partnered = data.partnered;

            let channelSettingsElement = new DOMParser().parseFromString(this.description, "text/html").querySelector('img[alt^="!!better-mixer-desc-flags!!"]');
            if (channelSettingsElement){
                try {
                    let parsed = JSON.parse(channelSettingsElement.alt.slice(27));
                    this.channelSettings = parsed;
                    this.plugin.log("Loaded description flags.", BetterMixer.LogType.INFO);
                }
                catch (error){
                    this.plugin.log("This channel has corrupt description flags.", BetterMixer.LogType.WARN);
                    this.channelSettings = {};
                }
            }
            else{
                this.plugin.log("This channel has no description flags.", BetterMixer.LogType.INFO);
                this.channelSettings = {};
            }

            this.twitchChannel = this.plugin.twitch.getSync(this);
            if (this.twitchChannel){
                this.bttvChannel = this.plugin.bttv.getSync(this.twitchChannel);
                this.ffzChannel = this.plugin.ffz.getSync(this.twitchChannel);
            }
            // this.gameWispChannel = plugin.gameWisp.getSync(this);

            this.chat = new Chat(this);
            this.plugin.dispatchEvent(BetterMixer.Events.ON_CHAT_START_LOAD, this.chat, this);
            this.plugin.log(`Loaded channel '${this.channelName}'`, BetterMixer.LogType.INFO);
        } catch (err){
            this.plugin.log(`${err.message}: Failed to get channel ${this.channelName}`, BetterMixer.LogType.ERROR);
        }
    }

    loadChat(element){
        if (this.chat){
            this.chat.load(element);
        }
        else{
            const loader = this.plugin.addEventListener(BetterMixer.Events.ON_CHAT_START_LOAD, e => {
                if (e.data === this.chat){
                    e.data.load(element);
                    this.plugin.removeEventListener(BetterMixer.Events.ON_CHAT_START_LOAD, loader);    
                }
            });
        }
    }

    unload(){
        this.chat.unload();
        this.ffzChannel && this.ffzChannel.unload();
        this.bttvChannel && this.bttvChannel.unload();
        this.twitchChannel && this.twitchChannel.unload();
        // this.gameWispChannel && this.gameWispChannel.unload();
    }
}
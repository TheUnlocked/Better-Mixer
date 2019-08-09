import BetterMixer from "./BetterMixer.js";
import Chat from "./Chat.js";
import User from "./User.js";

export default class Channel {
    /**
     * @param {BetterMixer} plugin 
     * @param {string} channelName 
     */
    constructor(plugin, channelName){

        this.plugin = plugin;

        $.ajax({
            url: `https://mixer.com/api/v1/channels/${channelName}`,
            dataType: 'json',
            async: false,
            success: data => {
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

                this.twitchChannel = plugin.twitch.getSync(this);
                if (this.twitchChannel){
                    this.bttvChannel = plugin.bttv.getSync(this.twitchChannel);
                    this.ffzChannel = plugin.ffz.getSync(this.twitchChannel);
                }
                // this.gameWispChannel = plugin.gameWisp.getSync(this);

                this.chat = new Chat(this);
                this.plugin.log(`Loaded channel '${channelName}'`, BetterMixer.LogType.INFO);
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to get channel ${channelName}`, BetterMixer.LogType.ERROR)
        });
    }

    unload(){
        this.chat.unload();
        this.ffzChannel && this.ffzChannel.unload();
        this.bttvChannel && this.bttvChannel.unload();
        this.twitchChannel && this.twitchChannel.unload();
        // this.gameWispChannel && this.gameWispChannel.unload();
    }
}
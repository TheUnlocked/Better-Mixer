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
                this.ffzChannel = plugin.ffz.getSync(this);
                this.gameWispChannel = plugin.gameWisp.getSync(this);
                this.chat = new Chat(this);
                this.plugin.log(`Loaded channel '${channelName}'`, BetterMixer.LogType.INFO);
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to get channel ${channelName}`, BetterMixer.LogType.ERROR)
        });
    }

    unload(){
        this.chat.unload();
        this.ffzChannel && this.ffzChannel.unload();
        this.gameWispChannel && this.gameWispChannel.unload();
    }
}
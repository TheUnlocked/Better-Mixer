import Emote from "../../Emote.js";

export default class FFZChannel{
    constructor(parent, username) {

        this.ffz = parent;
        this.plugin = parent.plugin;
        this.channel = channel;
        this.twitch = username;
        this.emotes = [];

        $.ajax({
            url: `https://api.frankerfacez.com/v1/room/${username}`,
            dataType: 'json',
            async: false,
            success: data => {
                for (let emoteSet in data.sets) {
                    for (let emote of data.sets[emoteSet].emoticons) {
                        emotes.append(new Emote(emote.name, emote.urls['1'], emote.width, emote.height));
                    }
                }
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to load emotes from FFZ.`)
        });

    }
}
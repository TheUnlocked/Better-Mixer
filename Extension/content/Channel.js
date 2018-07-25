export default class Channel {
    constructor(plugin, channelName) {

        this.plugin = plugin;
        
        let retry = 0;

        while (retry != -1) {
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
                },
                error: xhr => this.plugin.log(`${xhr.statusText}: Failed to get channel ${channelName}`)
            });
        }
    }
}
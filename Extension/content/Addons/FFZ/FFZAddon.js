import FFZChannel from "./FFZChannel.js";

export default class FFZAddon {
    constructor(plugin) {

        this._plugin = plugin;

        $.ajax({
            url: `https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/ffzsync.json`,
            dataType: 'json',
            async: false,
            success: data => {
                this._syncList = data;
            },
            error: xhr => this._plugin.log(`${xhr.statusText}: Failed to access FFZ sync list.`)
        });
    }

    getSync(name){
        let twitchName = this._syncList[name];
        if (twitchName){
            return new FFZChannel(this, twitchName);
        }
        this._plugin.log(`${name} is not FFZ synced.`);
        return undefined;
    }
}
import BetterMixer from "../../BetterMixer.js";
import TwitchAddon from "./TwitchAddon.js";
import Channel from "../../Channel.js";
import { fetchJson } from "../../Utility/Promise.js";

export default class TwitchChannel {
    twitch: TwitchAddon;
    plugin: BetterMixer;
    channel: Channel;
    login?: string;
    id?: number;
    displayName?: string;

    constructor(parent: TwitchAddon, channel: Channel, usernameOrId: string | number) {
        this.twitch = parent;
        this.plugin = parent.plugin;
        this.channel = channel;

        if (typeof usernameOrId === 'string') {
            this._loadByUserName(usernameOrId);
        }
        else {
            this._loadByUserId(usernameOrId);
        }
    }

    async _loadByUserName(username: string) {
        this.login = username;
        try {
            this._successHandler(await fetchJson(`https://bettermixer.web.app/api/v1/twitch-user-info?username=${username}`));
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to obtain ID from Twitch username.`, BetterMixer.LogType.WARN);
        }
    }

    async _loadByUserId(id: number) {
        this.id = id;
        try {
            this._successHandler(await fetchJson(`https://bettermixer.web.app/api/v1/twitch-user-info?id=${id}`));
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to obtain Twitch user information from provided data.`, BetterMixer.LogType.WARN);
        }
    }

    _successHandler(data: {
        id: string;
        username: string;
    }) {
        this.login = data.username;
        this.id = +data.id;
        this.displayName = data.username;
        this.plugin.log(`Loaded Twitch user information for ${this.displayName}.`, BetterMixer.LogType.INFO);
    }

    unload() {
        
    }
}

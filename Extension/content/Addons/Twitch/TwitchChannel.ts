import BetterMixer from "../../BetterMixer.js";
import TwitchAddon from "./TwitchAddon.js";
import Channel from "../../Channel.js";
import { fetchJson } from "../../Utility/Util.js";

export default class TwitchChannel {
    twitch: TwitchAddon;
    plugin: BetterMixer;
    channel: Channel;
    login?: string;
    id?: number;
    displayName?: string;

    private _requestConfig: { headers: { [header: string]: string } };

    constructor(parent: TwitchAddon, channel: Channel, usernameOrId: string | number) {
        this.twitch = parent;
        this.plugin = parent.plugin;
        this.channel = channel;
        this._requestConfig = { headers: { "Client-ID": "k2dxpcz1dl6fe771vzcsl1bx324osz" } };

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
            this._successHandler(await fetchJson(`https://api.twitch.tv/helix/users?login=${username}`, this._requestConfig));
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to obtain ID from Twitch username.`, BetterMixer.LogType.WARN);
        }
    }

    async _loadByUserId(id: number) {
        this.id = id;
        try {
            this._successHandler(await fetchJson(`https://api.twitch.tv/helix/users?id=${id}`, this._requestConfig));
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to obtain Twitch user information from provided data.`, BetterMixer.LogType.WARN);
        }
    }

    _successHandler(data: {
        /* eslint-disable camelcase */
        data: {
            id: string;
            login: string;
            display_name: string;
            type: string;
            broadcaster_type: string;
            description: string;
            profile_image_url: string;
            offline_image_url: string;
            view_count: number;
        }[];
        /* eslint-enable camelcase */
    }) {
        this.login = data.data[0].login;
        this.id = +data.data[0].id;
        this.displayName = data.data[0].display_name;
        this.plugin.log(`Loaded Twitch user information for ${this.displayName}.`, BetterMixer.LogType.INFO);
    }

    unload() {
        
    }
}

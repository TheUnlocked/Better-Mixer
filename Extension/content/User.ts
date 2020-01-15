import Badge from "./Badge.js";
import { fetchJson } from "./Utility/Util.js";
import BetterMixer from "./BetterMixer.js";

export default class User {
    username: string;
    level?: number;
    experience?: number;
    sparks?: number;
    pro?: boolean;
    partnered?: boolean;
    staff?: boolean;
    badges: Badge[];
    id?: number;

    private _populated?: boolean;

    /** A new user only must have a username. populateUser() must be called in order to fill the user with all relevant information */
    constructor(data: MixerUserWithGroups | { username: string }) {
        this.username = data.username;
        this.badges = [];
        this._loadUser(data as MixerUserWithGroups);
    }

    _loadUser(data: MixerUserWithGroups) {
        this.username = data.username;
        this.id = data.id;
        this.level = data.level;
        this.experience = data.experience;
        this.sparks = data.sparks;
        this.pro = false;
        this.partnered = false;
        this.staff = false;

        if (data.groups) {
            for (const group of data.groups) {
                switch (group.name) {
                    case "Pro":
                        this.pro = true;
                        break;
                    case "Partner":
                        this.partnered = true;
                        break;
                    case "Staff":
                        this.staff = true;
                        break;
                }
            }
        }
    }

    async populateUser() {
        if (this._populated) {
            return;
        }

        try {
            const data = await fetchJson(`https://mixer.com/api/v1/channels/${this.username}`);
            this._populated = true;
            this._loadUser(data);
        }
        catch (err) {
            BetterMixer.instance.log(`${err.message}: Failed to get channel ${this.username}`, BetterMixer.LogType.ERROR);
        }
    }

    addBadge(badge: Badge) {
        if (!this.badges.includes(badge)) {
            this.badges.push(badge);
        }
    }
}
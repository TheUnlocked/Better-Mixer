import Badge from "./Badge.js";
import { fetchJson } from "./Utility/Util.js";

export default class User {
    /**
     * A new user only must have a username. populateUser() must be called in order to fill the user with all relevant information.
     * @param {Object} data 
     */
    constructor(data) {

        this._loadUser = (data) => {
            this.username = data.username;
            this.id = data.id;
            this.userId = data.userId;
            this.level = data.level;
            this.experience = data.experience;
            this.sparks = data.sparks;
            this.pro = false;
            this.partnered = false;
            this.staff = false;
            this.badges = [];

            if ('groups' in data) {
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
        };

        this._loadUser(data);
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
            this.plugin.log(`${err.message}: Failed to get channel ${this.username}`, BetterMixer.LogType.ERROR);
        }
    }

    /**
     * 
     * @param {Badge} badge 
     */
    addBadge(badge) {
        if (!this.badges.includes(badge)) {
            this.badges.push(badge);
        }
    }
}
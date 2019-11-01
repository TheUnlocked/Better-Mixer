import Channel from "./Channel.js";
import ChatMessage from "./ChatMessage.js";
import BetterMixer from "./BetterMixer.js";
import Badge from "./Badge.js";
import { observeNewElements } from "./Utility/Util.js";

export default class Chat {
    /**
     * @param {Channel} channel 
     */
    constructor(channel){

        this.channel = channel;
        this.plugin = channel.plugin;
        this.users = { [channel.owner.username]: channel.owner };

        this._loaded = false;
    }

    load(element){
        this.element = element;

        if (this._loaded){
            this.unload();
        }
        else{
            this._loaded = true;
        }
        this._msgObserver = observeNewElements('div[class*="message__"]', this.element, element => {
            let usernameElement = element.querySelectorAll('[class*="Username"]')[0];
            if (element.__bettermixer_sent || !usernameElement){
                return;
            }
            let authorName = usernameElement.innerText.split(" ")[0];
            let msg = new ChatMessage(this, element, this.users[authorName]);
            // Disabled because of potential memory explosion
            // if (!this.users[authorName]){
            //     this.users[authorName] = msg.author;
            // }
            this.plugin.dispatchEvent(BetterMixer.Events.ON_MESSAGE, null, msg);
            element.__bettermixer_sent = true;
        });

        this._gatherBadges = event => {
            if (event.data.channel.chat !== this){
                return;
            }

            let badges = [];
            for (let badgeElement of event.data.message.element.querySelectorAll('[class*="badge"]')){
                if (badgeElement.alt == 'Subscriber'){
                    if (!this.subBadge){
                        this.subBadge = new Badge('Subscriber', badgeElement.src, 'Subscriber', badgeElement);
                    }
                    badges.push(this.subBadge);
                }
                else if (badgeElement.alt == 'Staff'){
                    if (!this.staffBadge){
                        badgeElement.style.margin = "0";
                        this.staffBadge = new Badge('Staff', badgeElement.src, 'A member of the Mixer staff', badgeElement);
                    }
                    badges.push(this.staffBadge);
                }
            }
            return badges;
        };
        this.plugin.addEventListener(BetterMixer.Events.GATHER_BADGES, this._gatherBadges);

        this._emoteDialogObserver = observeNewElements('[class*="wrapper"] h1', element, element => {
            if (element.innerHTML === "Emotes"){
                this.plugin.dispatchEvent(BetterMixer.Events.ON_EMOTES_DIALOG_OPEN, { dialog: element.parentElement }, this);
            }
        });

        this.plugin.dispatchEvent(BetterMixer.Events.ON_CHAT_FINISH_LOAD, this, this);
    }

    unload(){
        this._msgObserver && this._msgObserver.disconnect();
        this._emoteDialogObserver && this._emoteDialogObserver.disconnect();
        this._gatherBadges && this.plugin.removeEventListener(BetterMixer.Events.GATHER_BADGES, this._gatherBadges);
        this._loaded = false;
    }
}
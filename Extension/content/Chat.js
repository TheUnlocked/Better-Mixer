import Channel from "./Channel.js";
import ChatSocket from "./ChatSocket.js";
import ChatMessage from "./ChatMessage.js";
import BetterMixer from "./BetterMixer.js";
import Badge from "./Badge.js";

export default class Chat {
    /**
     * @param {Channel} channel 
     */
    constructor(channel){

        this.channel = channel;
        this.plugin = channel.plugin;
        this.users = { [channel.owner.username]: channel.owner };

        this._loaded = false;
        this._chatLoadObserver = event => {
            this.element = event.data.element;

            if (!this._loaded){
                this.partialUnload();
                this._loaded = true;
            }
            if (event.data.channel == this.channel){
                this._msgObserver = $.initialize('div[class*="message__"]', (_, element) => {
                    let usernameElement = element.querySelectorAll('[class*="Username"]')[0];
                    if (!usernameElement){
                        return;
                    }
                    let authorName = usernameElement.innerText.split(" ")[0];
                    let msg = new ChatMessage(this, element, this.users[authorName]);
                    // Disabled because of potential memory explosion
                    // if (!this.users[authorName]){
                    //     this.users[authorName] = msg.author;
                    // }
                    this.plugin.dispatchEvent(BetterMixer.Events.ON_MESSAGE, null, msg);
                }, { target: event.data.element });

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
                        else if (badgeElement.children.length > 0 && badgeElement.children[0].alt == 'Staff'){
                            if (!this.staffBadge){
                                this.staffBadge = new Badge('Staff', badgeElement.children[0].src, 'A member of the Mixer staff', badgeElement);
                            }
                            badges.push(this.staffBadge);
                        }
                    }
                    return badges;
                };
                this.plugin.addEventListener(BetterMixer.Events.GATHER_BADGES, this._gatherBadges);

                this._emoteDialogObserver = $.initialize('[class*="wrapper"] h1', (_, element) => {
                    if (element.innerText == "EMOTICONS" || element.innerText == "EMOTES"){
                        this.plugin.dispatchEvent(BetterMixer.Events.ON_EMOTES_DIALOG_OPEN, { dialog: element.parentElement }, this);
                    }
                }, { target: event.data.element });

                this.plugin.dispatchEvent(BetterMixer.Events.ON_CHAT_FINISH_LOAD, this, this);
            }
        }

        this.plugin.addEventListener(BetterMixer.Events.ON_CHAT_START_LOAD, this._chatLoadObserver);
    }

    partialUnload(){
        this._msgObserver && this._msgObserver.disconnect();
        this._emoteDialogObserver && this._emoteDialogObserver.disconnect();
        this._gatherBadges && this.plugin.removeEventListener(BetterMixer.Events.GATHER_BADGES, this._gatherBadges);
        this._loaded = false;
    }

    unload(){
        this.partialUnload();
        this._chatLoadObserver && this.plugin.removeEventListener(BetterMixer.Events.ON_CHAT_FINISH_LOAD, this._chatLoadObserver);
    }
}
import Channel from "./Channel.js";
import ChatSocket from "./ChatSocket.js";
import ChatMessage from "./ChatMessage.js";
import BetterMixer from "./BetterMixer.js";
import Badge from "./Badge.js";

export default class Chat {
    /**
     * @param {Channel} channel 
     */
    constructor(channel, autoload = true){

        this.channel = channel;
        this.plugin = channel.plugin;
        this.users = { [channel.owner.username]: channel.owner };

        if (autoload){
            this.load();
        }
    }

    load(element = undefined){
        if (element){
            this.element = element;
        }
        else{
            this.element = document.querySelector('div[class*="chatContainer"]:not(.bettermixer-chat-window)');
        }
        //this.socket = new ChatSocket(this);

        if (!this.element){
            setTimeout(() => this.load(), 100);
            return;
        }
        this.element.classList.add('bettermixer-chat-window');
        
        this.plugin.dispatchEvent(BetterMixer.Events.ON_CHAT_LOAD, this, this);
        
        this._msgObserver = $.initialize('div[class*="message__"]', (_, element) => {
            let usernameElement = element.querySelectorAll('[class*="Username"]')[0];
            if (!usernameElement){
                return;
            }
            let authorName = usernameElement.innerText;
            let msg = new ChatMessage(this, element, this.users[authorName]);
            if (!this.users[authorName]){
                this.users[authorName] = msg.author;
            }
            this.plugin.dispatchEvent(BetterMixer.Events.ON_MESSAGE, null, msg);
        }, { target: this.element });

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
            if (element.innerText == "EMOTICONS"){
                this.plugin.dispatchEvent(BetterMixer.Events.ON_EMOTES_DIALOG_OPEN, { dialog: element.parentElement }, this);
            }
        }, { target: this.element });
    }

    unload(){
        //this.socket.unload();
        this._msgObserver && this._msgObserver.disconnect();
        this._emoteDialogObserver && this._emoteDialogObserver.disconnect();
        this.plugin.removeEventListener(BetterMixer.Events.GATHER_BADGES, this._gatherBadges);
    }
}
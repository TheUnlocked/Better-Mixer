import Channel from "./Channel.js";
import ChatSocket from "./ChatSocket.js";
import ChatMessage from "./ChatMessage.js";
import BetterMixer from "./BetterMixer.js";

export default class Chat {
    /**
     * @param {Channel} channel 
     */
    constructor(channel){

        this.channel = channel;
        this.plugin = channel.plugin;
        this.users = { [channel.owner.username]: channel.owner };

        let registerChatObserver = (() => {
            this.element = document.getElementsByTagName('b-channel-chat-messages')[0];
            //this.socket = new ChatSocket(this);

            if (!this.element){
                setTimeout(registerChatObserver, 100);
                return;
            }
            this._msgObserver = $.initialize('b-channel-chat-message', (_, element) => {
                let authorName = this.element.getElementsByClassName('username')[0].innerText;
                let msg = new ChatMessage(this, element, this.users[authorName]);
                if (!this.users[authorName]){
                    this.users[authorName] = msg.author;
                }
                this.plugin.dispatchEvent(BetterMixer.Events.ON_MESSAGE, null, msg);
            }, { target: this.element });
        });

        registerChatObserver();
    }

    unload(){
        //this.socket.unload();
        this._msgObserver.disconnect();
    }
}
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

        let registerChatObserver = (() => {
            this.element = document.getElementsByTagName('b-channel-chat-messages')[0];
            //this.socket = new ChatSocket(this);

            if (!this.element){
                setTimeout(registerChatObserver, 100);
                return;
            }
            this._msgObserver = $.initialize('b-channel-chat-message', (_, element) => {
                let msg = new ChatMessage(this, element);
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
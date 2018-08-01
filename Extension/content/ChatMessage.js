import BetterMixer from "./BetterMixer.js";
import Chat from "./Chat.js";

export default class ChatMessage {
    /**
     * @param {Chat} chat 
     * @param {Element} element 
     */
    constructor(chat, element){

        this.chat = chat;
        this.plugin = chat.plugin;
        this.element = element;
        this.author = author;
        this.text = text;

        plugin.dispatchEvent(BetterMixer.Events.ON_MESSAGE, null, this);

    }
}
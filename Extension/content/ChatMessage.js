import Chat from "./Chat.js";
import User from "./User.js";

export default class ChatMessage {
    /**
     * @param {Chat} chat 
     * @param {Element} element 
     */
    constructor(chat, element){

        this._element = element;
        this._authorElement = element.getElementsByTagName('b-channel-chat-author')[0];

        this.chat = chat;
        this.plugin = chat.plugin;
        this.author = new User({ username: this._authorElement.getElementsByClassName('username')[0].innerText });

    }
}
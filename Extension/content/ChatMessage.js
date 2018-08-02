import Chat from "./Chat.js";
import User from "./User.js";
import BetterMixer from "./BetterMixer.js";

export default class ChatMessage {
    /**
     * @param {Chat} chat 
     * @param {Element} element 
     * @param {User} author
     */
    constructor(chat, element, author = undefined){

        this.chat = chat;
        this.plugin = chat.plugin;
        this.element = element;
        if (author){
            this.author = author;
        }
        else{
            this.author = new User({ username: this.element.getElementsByClassName('username')[0].innerText });
        }
    }
}
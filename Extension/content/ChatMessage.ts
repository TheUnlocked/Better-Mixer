import Chat from "./Chat.js";
import User from "./User.js";
import BetterMixer from "./BetterMixer.js";

export default class ChatMessage {
    chat: Chat;
    plugin: BetterMixer;
    element: Element;
    author: User;
    constructor(chat: Chat, element: Element, author: User | undefined = undefined) {
        this.chat = chat;
        this.plugin = chat.plugin;
        this.element = element;
        if (author) {
            this.author = author;
        }
        else {
            this.author = new User({ username: (this.element.querySelector('[class*="Username"]') as HTMLElement).innerText.split(' ')[0]});
        }
    }
}
export default class ChatMessage {
    constructor(channel, element, id, author, text) {
        this.channel = channel;
        this.plugin = channel.plugin;
        if (element.tagName != "B-CHANNEL-CHAT-MESSAGE"){
            plugin.log(element + " is not a valid chat message.");
        }
        this.id = id;
        this.element = element;
        this.author = author;
        this.text = text;
    }
}
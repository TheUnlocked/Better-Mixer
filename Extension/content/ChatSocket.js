export default class ChatSocket {
    constructor(chat) {

        this.chat = chat;
        this.plugin = chat.plugin;
        this._msgid = 0;
        this._callbackBuffer = {};

    }

    loadChat(){
        return new Promise((resolve, _) => { 
            $.getJSON(`https://mixer.com/api/v1/chats/${id}`, function (data) {
                this.socket = new WebSocket(data.endpoints[0]);
    
                this.socket.onopen = e => {
                    this.permissions = data.permissions;

                    chat.get = (method, ...args) => new Promise((resolve, reject) => {
                        callbackBuffer[msgId] = [resolve, reject];
                        chat.send(method, ...args);
                    });
    
                    chat.lastMessages = (count=1) => chat.get("history", count);
                    chat.deleteMessage = (id) => chat.send("deleteMessage", id);
    
                    $.getJSON('https://mixer.com/api/v1/users/current', (userData) => {
                        chat.send("auth", id, userData.id, data.authkey);
                        this.plugin.log("Connected to chat!");
    
                        resolve(chat);
                    });
                };

                this.socket.onmessage = event => {
                    let data = JSON.parse(event.data);
                    if (data.type == "reply"){
                        if (callbackBuffer[data.id]){
                            if (!data.error){
                                callbackBuffer[data.id][0](data.data);
                            }
                            else{
                                callbackBuffer[data.id][1](data.error);
                            }
                            delete callbackBuffer[data.id];
                        }
                    }
                };
            });
        });
    }

    send (method, ...args) {
        this.socket.send(JSON.stringify({
            "type": "method",
            "method": method,
            "arguments": args,
            "id": this._msgid++
        }));
    };
}
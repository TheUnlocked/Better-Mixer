function loadChat(channelNameOrID){
    return new Promise((resolve, reject) => {
        let userID = parseInt(usernameOrID);

        if (!userID) {
            $.getJSON(`https://mixer.com/api/v1/channels/${channelNameOrID}`, function (data) {
                loadChatFromChannelID(data.id);
            });
        }
        loadChatFromChannelID(userID)
            .then(resolve);
    });
}

function loadChatFromChannelID(id){
    return new Promise((resolve, reject) => {
        $.getJSON(`https://mixer.com/api/v1/chats/${id}`, function (data) {
            let ws = new WebSocket(data.endpoints[0]);

            let msgId = 0;
            let chat = {};
            let callbackBuffer = {};

            ws.onmessage = (event) => {
                let data = JSON.parse(event.data);
                if (event.type == "reply"){
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

            chat.send = (method, ...args) => {
                ws.send(JSON.stringify({
                    "type": "method",
                    "method": method,
                    "arguments": args,
                    "id": msgId++
                }));
            };
            chat.get = (method, ...args) => new Promise((resolve, reject) => {
                callbackBuffer[msgId] = [resolve, reject];
                chat.send(method, ...args);
            });

            chat.lastMessages = (count=1) => ws.get("history", count);
            chat.deleteMessage = (id) => ws.send("deleteMessage", id);

            resolve(chat);
        });
    });
}
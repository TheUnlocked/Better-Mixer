// export default class ChatSocket {
//     constructor(chat){

//         this.chat = chat;
//         this.plugin = chat.plugin;
//         this.socket = null;
//         this.permissions = [];
//         this._msgid = 0;
//         this._callbackBuffer = {};

//     }

//     loadChat(){
//         return new Promise((resolve, _) => { 
//             $.getJSON(`https://mixer.com/api/v1/chats/${id}`, function (data) {
//                 this.socket = new WebSocket(data.endpoints[0]);
    
//                 this.socket.onopen = e => {
//                     this.permissions = data.permissions;
    
//                     $.getJSON('https://mixer.com/api/v1/users/current', (userData) => {
//                         this.send("auth", id, userData.id, data.authkey);
//                         this.plugin.log("Connected to chat!");
    
//                         resolve(chat);
//                     });
//                 };

//                 this.socket.onmessage = event => {
//                     let data = JSON.parse(event.data);
//                     if (data.type == "reply"){
//                         if (callbackBuffer[data.id]){
//                             if (!data.error){
//                                 callbackBuffer[data.id][0](data.data);
//                             }
//                             else{
//                                 callbackBuffer[data.id][1](data.error);
//                             }
//                             delete callbackBuffer[data.id];
//                         }
//                     }
//                 };
//             });
//         });
//     }

//     unload(){
//         this.socket.close();
//     }

//     /**
//      * Sends a method to the websocket
//      * @param {Function} method 
//      * @param {any} args 
//      */
//     send(method, ...args){
//         this.socket.send(JSON.stringify({
//             "type": "method",
//             "method": method,
//             "arguments": args,
//             "id": this._msgid++
//         }));
//     }

//     /**
//      * Same as ChatSocket.send except it returns a promise which recieves the reply.
//      * @param {Function} method 
//      * @param {any} args 
//      */
//     get(method, ...args){
//         return new Promise((resolve, reject) => {
//             callbackBuffer[msgId] = [resolve, reject];
//             chat.send(method, ...args);
//         });
//     }
    
//     getHistory(numMessages){
//         return this.get("history", numMessages);
//     }

//     deleteMessage(messageId){
//         return this.send("deleteMessage", messageId);
//     }
// }
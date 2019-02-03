import Patcher from "./Patcher.js";

export default class Emote{
    constructor(name, image, width, height){

        this.name = name;
        this.image = image;
        if (height < 32){
            this.height = height;
            this.width = width;
        }
        else{
            this.height = 32;
            this.width = width / height * 32;
        }
    }

    get element(){
        // Create emote
        let emote = document.createElement('div');
        emote.classList.add('graphic', 'bettermixer-emotes');
        let image = document.createElement('img');
        image.src = this.image;
        image.alt = this.name + " ";
        image.style.height = this.height + "px";
        image.style.width = this.width + "px";

        // let emoteWidth = document.createElement('div');
        // emoteWidth.style.width = this.width + "px";

        //image.title = this.name;
        emote.appendChild(image);
        // emote.appendChild(emoteWidth);
        
        Patcher.addTooltip(emote, this.name);

        return emote;
    }
}
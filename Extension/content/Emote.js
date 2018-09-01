import Patcher from "./Patcher.js";

export default class Emote{
    constructor(name, image, width, height){

        this.name = name;
        this.image = image;
        this.height = height;
        this.width = width;

    }

    get element(){
        // Create emote
        let emote = document.createElement('div');
        emote.classList.add('graphic', 'bettermixer-emotes');
        let image = document.createElement('img');
        image.src = this.image;
        image.alt = this.name;
        image.style.height = this.height + "px";
        image.style.width = this.width + "px";

        //image.title = this.name;
        emote.appendChild(image);
        
        Patcher.addTooltip(emote, this.name);

        return emote;
    }
}
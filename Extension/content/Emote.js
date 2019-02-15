import Patcher from "./Patcher.js";

export default class Emote{
    constructor(name, image, width, height, animated=false){

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
        this.animated = animated;
    }

    get element(){
        // Create emote
        let emote = document.createElement('div');
        emote.classList.add('graphic', 'bettermixer-emote');
        let image = document.createElement('img');
        image.src = this.image;
        image.alt = this.name + " ";
        image.style.height = this.height + "px";
        image.style.width = this.width + "px";
        if (this.animated){
            emote.classList.add('bettermixer-emote-animated');
        }
        let text = document.createElement('span');
        text.classList.add('bettermixer-emote-text');
        text.innerHTML = this.name;

        // let emoteWidth = document.createElement('div');
        // emoteWidth.style.width = this.width + "px";

        //image.title = this.name;
        emote.appendChild(image);
        emote.appendChild(text);
        // emote.appendChild(emoteWidth);
        
        Patcher.addTooltip(image, this.name);

        return emote;
    }
}
import Patcher from "./Patchers/Patcher.js";

export default class Emote {
    constructor(name, image, width, height, animated = false) {

        this.name = name;
        this.image = image;
        if (height < 28) {
            this.height = height;
            this.width = width;
        }
        else {
            this.height = 28;
            this.width = width / height * 28;
        }
        this.animated = animated;
    }

    get element() {
        // Create emote
        const emote = document.createElement('div');
        emote.classList.add('bettermixer-emote');
        const image = this.imageElement;
        if (this.animated) {
            emote.classList.add('bettermixer-emote-animated');
        }
        const text = document.createElement('span');
        text.classList.add('bettermixer-emote-text');
        text.textContent = this.name;

        // let emoteWidth = document.createElement('div');
        // emoteWidth.style.width = this.width + "px";

        //image.title = this.name;
        emote.appendChild(image);
        emote.appendChild(text);
        // emote.appendChild(emoteWidth);
        
        Patcher.addTooltip(image, this.name);

        return emote;
    }

    get imageElement() {
        const image = document.createElement('img');
        image.src = this.image;
        image.alt = this.name + " ";
        image.style.height = this.height + "px";
        image.style.width = this.width + "px";
        return image;
    }
}

export class VanillaEmote extends Emote {
    constructor(name, spritesheet, position) {
        super(name, spritesheet, position.width, position.height, false);
        this.position = position;
    }

    get element() {
        throw new Error("VanillaEmote elements cannot be instantiated.");
    }

    get imageElement() {
        const image = document.createElement('span');
        image.style.backgroundImage = `url(${this.image})`;
        image.style.backgroundPositionX = `${-this.position.x}px`;
        image.style.backgroundPositionY = `${-this.position.y}px`;
        image.style.width = `${this.width}px`;
        image.style.height = `${this.height}px`;
        return image;
    }
}
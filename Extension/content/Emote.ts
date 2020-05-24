import Patcher from "./Patchers/Patcher.js";

export default class Emote {
    name: string;
    image: string;
    height: number;
    width: number;
    animated: boolean;

    constructor(name: string, image: string, width: number, height: number, animated = false) {
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

    get imageElement(): HTMLElement {
        const image = document.createElement('img');
        image.src = this.image;
        image.alt = this.name + " ";
        image.style.height = this.height + "px";
        image.style.width = this.width + "px";
        return image;
    }
}

export class VanillaEmote extends Emote {
    position: {x: number; y: number};
    spritesheetSize: {width: number; height: number};

    constructor(
        name: string,
        spritesheet: string,
        position: {x: number; y: number},
        size: {width: number; height: number},
        spritesheetSize: {width: number; height: number}
    ) {
        super(name, spritesheet, size.width, size.height, false);
        this.position = position;
        this.spritesheetSize = spritesheetSize;
    }

    get element(): never {
        throw new Error("VanillaEmote elements cannot be instantiated.");
    }

    get imageElement() {
        const image = document.createElement('span');
        image.style.backgroundImage = `url(${this.image})`;
        image.style.backgroundPositionX = `${-this.position.x}px`;
        image.style.backgroundPositionY = `${-this.position.y}px`;
        image.style.backgroundSize = `${this.spritesheetSize.width}px ${this.spritesheetSize.height}px`;
        image.style.width = `${this.width}px`;
        image.style.height = `${this.height}px`;
        return image;
    }
}
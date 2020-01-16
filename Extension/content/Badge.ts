import Patcher from "./Patchers/Patcher.js";
import BetterMixer from "./BetterMixer.js";

export default class Badge {
    name: string;
    image: any;
    example?: Element;

    constructor(name: string, image: any, example?: Element) {

        this.name = name;
        this.image = image;
        this.example = example;

    }

    get element() {
        let badge;
        if (this.example) {
            badge = this.example.cloneNode(true) as HTMLElement;
        }
        else {
            badge = document.createElement('img');
            badge.classList.add(BetterMixer.ClassNames.BADGE);
            badge.src = this.image;
            badge.alt = this.name;
        }

        Patcher.addTooltip(badge, this.name);

        return badge;
    }

}
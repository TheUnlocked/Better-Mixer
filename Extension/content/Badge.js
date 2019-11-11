import Patcher from "./Patchers/Patcher.js";
import BetterMixer from "./BetterMixer.js";

export default class Badge {
    /**
     * 
     * @param {String} name 
     * @param {String} image 
     * @param {String} description 
     * @param {String} vanillaSelector
     */
    constructor(name, image, description, example = undefined) {

        this.name = name;
        this.image = image;
        this.description = description;
        this.example = example;

    }

    get element() {
        let badge;
        if (this.example) {
            badge = this.example.cloneNode(true);
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
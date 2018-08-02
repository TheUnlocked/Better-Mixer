export default class Badge{
    /**
     * 
     * @param {String} name 
     * @param {String} image 
     * @param {String} description 
     * @param {String} vanillaSelector
     */
    constructor(name, image, description, example = undefined){

        this.name = name;
        this.image = image;
        this.description = description;
        this.example = example;

    }

    get element(){
        if (this.example){
            return this.example.cloneNode(true);
        }
        let badge = document.createElement('img');
        badge.classList.add('badge');
        badge.src = this.image;
        badge.alt = this.name;

        badge.addEventListener('mouseover', () => {
            let tooltip = document.createElement('div');
            document.body.appendChild(tooltip); // This needs to happen first to make sure tooltip.clientWidth works correctly.

            tooltip.innerHTML = this.name;
            let rect = badge.getBoundingClientRect();
            tooltip.classList.add('bettermixer-tooltip');
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.clientWidth / 2) + "px";
            tooltip.style.top = rect.top - 24 + "px";
            tooltip.style.pointerEvents = "none";
            badge.addEventListener('mouseout', function mouseoutEvent() {
                document.body.removeChild(tooltip);
                badge.removeEventListener('mouseout', mouseoutEvent);
            });
        });

        return badge;
    }

}
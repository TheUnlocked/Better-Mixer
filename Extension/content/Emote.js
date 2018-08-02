export default class Emote{
    constructor(name, image, height, width){

        this.name = name;
        this.image = image;
        this.height = height;
        this.width = width;

    }

    get element(){
        // Create emote
        let emote = document.createElement('div');
        emote.classList.add('graphic', 'bettermixer-emotes');
        emote.style.height = this.height + "px";
        emote.style.width = this.width + "px";
        let image = document.createElement('img');
        image.src = this.image;
        image.alt = this.name;
        //image.title = this.name;
        emote.appendChild(image);

        // Create tooltip
        emote.addEventListener('mouseover', () => {
            let tooltip = document.createElement('div');
            document.body.appendChild(tooltip); // This needs to happen first to make sure tooltip.clientWidth works correctly.

            tooltip.innerHTML = this.name;
            let rect = emote.getBoundingClientRect();
            tooltip.classList.add('bettermixer-emote-tooltip');
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.clientWidth / 2) + "px";
            tooltip.style.top = rect.top - 24 + "px";
            tooltip.style.pointerEvents = "none";
            emote.addEventListener('mouseout', function mouseoutEvent() {
                document.body.removeChild(tooltip);
                emote.removeEventListener('mouseout', mouseoutEvent);
            });
        });

        return emote;
    }
}
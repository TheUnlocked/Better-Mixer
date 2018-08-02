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
        return badge;
    }

}
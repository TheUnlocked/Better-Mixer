import Config from "./Config.js";

export default class DropdownConfig extends Config {
    constructor(configName, displayText, descriptionText = "", options = {}, defaultState = ""){
        super();

        this._configName = configName;
        this._displayText = displayText;
        this._descriptionText = descriptionText;
        this._options = options;
        this._defaultState = defaultState;
        this._state = defaultState;
    }

    // The name used internally
    get configName(){
        return this._configName;
    }

    // The name seen in the settings menu
    get displayText(){
        return this._displayText;
    }

    // A currently unused property explaining the config
    get descriptionText(){
        return this._descriptionText;
    }

    // Set the config state
    set state(state){
        this._state = state;
    }

    // Get the config state
    get state(){
        return this._state;
    }

    // The state to be held before the config is modified
    get defaultState(){
        return this._defaultState;
    }

    get options(){
        return Object.keys(this._options);
    }

    getDisplayFromOption(option){
        return this._options[option] || "";
    }

    // Updates the configuration effect
    update(){
        
    }

    // The type of config, currently unused as configs can only be booleans
    get configType(){
        return Config.ConfigTypeEnum.DROPDOWN;
    }
}
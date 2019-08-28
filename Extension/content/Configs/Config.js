export default class Config{
    // The name used internally
    get configName(){
        return "";
    }

    // The name seen in the settings menu
    get displayText(){
        return "";
    }

    // A currently unused property explaining the config
    get descriptionText(){
        return "";
    }

    // Set the config state
    set state(state){
    }

    // Get the config state
    get state(){
        return null;
    }

    // The state to be held before the config is modified
    get defaultState(){
        return null;
    }

    // Updates the configuration effect
    update(){
    }

    // Updates immediately on being changed
    updateImmediate(newState){
    }

    // Determines whether or not to hide this config in the menu
    // Unnecessary if the config type is NONE.
    get hidden(){
        return false;
    }

    get configType(){
        return Config.ConfigTypeEnum.NONE;
    }
}

Config.ConfigTypeEnum = Object.freeze({
    NONE: 0,
    BOOLEAN: 1,
    STRING: 2,
    COLOR: 3,
    DROPDOWN: 4
});
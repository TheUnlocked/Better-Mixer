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

    // The type of config, currently unused as configs can only be booleans
    get configType(){
        return Config.ConfigTypeEnum.BOOLEAN;
    }
}

Config.ConfigTypeEnum = Object.freeze({
    BOOLEAN: 0
});
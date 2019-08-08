import DropdownConfig from "./DropdownConfig.js";

export default class BotDetectionConfig extends DropdownConfig {
    constructor(){
        super('bot_detection_method', 'Bot Detection Method', "", {
            'off': "Disable",
            'auto': "Automatic",
            'custom': "RegEx"
        }, 'auto');
    }

    // Updates the configuration effect
    update(){
        
    }
}
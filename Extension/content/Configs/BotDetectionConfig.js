import DropdownConfig from "./DropdownConfig.js";

export default class BotDetectionConfig extends DropdownConfig {
    constructor(){
        super('botcolor_mode', 'Bot Detection Method', "", {
            'off': "Disable",
            'auto': "Automatic",
            'custom': "RegEx"
        }, 'auto');
    }

    // Updates the configuration effect
    update(){
        for (let element of document.querySelectorAll('b-channel-chat-section .bettermixer-role-bot[class*="Username"]')){
            element.style.color = element.mixerColor;
        }
        if (this.state !== "off"){
            let regexConfig = BetterMixer.instance.configuration.getConfig("botcolor_regex");
            let botColor = BetterMixer.instance.configuration.getConfig("botcolor").state;
            let regex = this.state === "auto" ? regexConfig.defaultState : regexConfig.state;
            for (let element of document.querySelectorAll('b-channel-chat-section div[class*="message__"]')){
                let usernameElement = element.querySelector('[class*="Username"]');
                if (new RegExp(regex).test(usernameElement.innerText.split(" ")[0])){
                    usernameElement.mixerColor = usernameElement.style.color;
                    usernameElement.style.color = botColor;
                    usernameElement.classList.add('bettermixer-role-bot');
                }
            }
        }
    }

    updateImmediate(mewState){
        document.querySelector('[bettermixer-config-name="botcolor_regex"]').hidden = mewState !== "custom";
        document.querySelector('[bettermixer-config-name="botcolor"]').hidden = mewState === "off";
    }
}
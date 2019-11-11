import DropdownConfig from "./DropdownConfig.js";

export default class BotDetectionConfig extends DropdownConfig {
    constructor() {
        super('botcolor_mode', 'Bot Detection Method', "", {
            'off': "Disable",
            'auto': "Automatic",
            'custom': "RegEx"
        }, 'auto');
    }

    // Updates the configuration effect
    update() {
        for (const element of document.querySelectorAll('b-channel-chat-section .bettermixer-role-bot[class*="Username"]')) {
            element.style.color = element.mixerColor;
        }
        if (this.state !== "off") {
            const regexConfig = BetterMixer.instance.configuration.getConfig("botcolor_regex");
            const botColor = BetterMixer.instance.configuration.getConfig("botcolor").state;
            const regex = this.state === "auto" ? regexConfig.defaultState : regexConfig.state;
            for (const element of document.querySelectorAll('b-channel-chat-section div[class*="message__"]')) {
                const usernameElement = element.querySelector('[class*="Username"]');
                if (new RegExp(regex).test(usernameElement.innerText.split(" ")[0])) {
                    usernameElement.mixerColor = usernameElement.style.color;
                    usernameElement.style.color = botColor;
                    usernameElement.classList.add('bettermixer-role-bot');
                }
            }
        }
    }

    updateImmediate(newState) {
        document.querySelector('[bettermixer-config-name="botcolor_regex"]').hidden = newState !== "custom";
        document.querySelector('[bettermixer-config-name="botcolor"]').hidden = newState === "off";
    }
}
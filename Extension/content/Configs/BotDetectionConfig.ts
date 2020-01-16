import DropdownConfig from "./DropdownConfig.js";
import BetterMixer from "../BetterMixer.js";

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
        for (const element of document.querySelectorAll('b-channel-chat-section .bettermixer-role-bot[class*="Username"]') as NodeListOf<HTMLElement>) {
            element.style.color = element.__bettermixerMixerColor;
        }
        if (this.state !== "off") {
            const regexConfig = BetterMixer.instance.configuration.getConfig("botcolor_regex");
            const botColor = BetterMixer.instance.configuration.getConfig("botcolor").state;
            const regex = this.state === "auto" ? regexConfig.defaultState : regexConfig.state;
            for (const element of document.querySelectorAll('b-channel-chat-section div[class*="message__"]')) {
                const usernameElement = element.querySelector('[class*="Username"]') as HTMLElement;
                if (new RegExp(regex).test(usernameElement.innerText.split(" ")[0])) {
                    usernameElement.__bettermixerMixerColor = usernameElement.style.color;
                    usernameElement.style.color = botColor;
                    usernameElement.classList.add('bettermixer-role-bot');
                }
            }
        }
    }

    updateImmediate(newState: string) {
        (document.querySelector('[bettermixer-config-name="botcolor_regex"]') as HTMLElement).hidden = newState !== "custom";
        (document.querySelector('[bettermixer-config-name="botcolor"]') as HTMLElement).hidden = newState === "off";
    }
}
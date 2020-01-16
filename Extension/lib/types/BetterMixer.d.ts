import BetterMixer from "../../content/BetterMixer.js";

declare global {
    interface Window { BetterMixer: new() => BetterMixer }
    interface HTMLElement { 
        __bettermixerSent: boolean;
        __bettermixerMixerColor: string | null;
    }
}
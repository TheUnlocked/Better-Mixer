import BetterMixer from "Extension/content/BetterMixer.js";

declare global {
    interface Window { BetterMixer: new() => BetterMixer }
    interface History { __bettermixerOnpushstate: any }
    interface HTMLElement { 
        __bettermixerSent: boolean;
        __bettermixerMixerColor: string | null;
    }
}
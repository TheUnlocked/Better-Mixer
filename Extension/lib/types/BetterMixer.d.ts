import BetterMixer from "Extension/content/BetterMixer";

declare global {
    interface Window { BetterMixer: new() => BetterMixer }
    // eslint-disable-next-line camelcase
    interface History { __bettermixer_onpushstate: any }
}
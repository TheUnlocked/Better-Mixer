import BetterMixer from "../../content/BetterMixer.js";

declare global {
    interface Window {
        BetterMixer: new() => BetterMixer;   
    }
    interface HTMLElement { 
        __bettermixerSent: boolean;
        __bettermixerMixerColor: string | null;
    }

    function __COMPILER_INLINE(type: 'target'): 'extension' | 'script';
    function __COMPILER_INLINE(type: 'stylesheet', source: string): string;
    function __COMPILER_INLINE(type: never, ...args: any[]): any;
}
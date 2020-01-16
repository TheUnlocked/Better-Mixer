type ConfigType = number;

export default abstract class Config<TState> {
    // The name used internally
    abstract get configName(): string;

    // The name seen in the settings menu
    get displayText(): string { return ""; }

    // A currently unused property explaining the config
    get descriptionText(): string { return ""; }

    // Set the config state
    abstract set state(state: TState);

    // Get the config state
    abstract get state(): TState;

    // The state to be held before the config is modified
    abstract get defaultState(): TState;

    // Updates the configuration effect
    update(): void {}

    // Updates immediately on being changed
    updateImmediate(newState: TState): void {}

    // Determines whether or not to hide this config in the menu
    // Unnecessary if the config type is NONE.
    get hidden(): boolean { return false; }

    abstract get configType(): ConfigType;

    get superText(): string | undefined { return undefined; }

    static ConfigTypeEnum: {[configTypeName: string]: ConfigType} = {
        NONE: 0,
        BOOLEAN: 1,
        STRING: 2,
        COLOR: 3,
        DROPDOWN: 4
    };
}
type ConfigType = number;

export default abstract class Config<TState> {
    // The name used internally
    abstract get configName(): string;

    // The name seen in the settings menu
    abstract get displayText(): string;

    // A currently unused property explaining the config
    abstract get descriptionText(): string;

    // Set the config state
    abstract set state(state: TState);

    // Get the config state
    abstract get state(): TState;

    // The state to be held before the config is modified
    abstract get defaultState(): TState;

    // Updates the configuration effect
    abstract update(): void;

    // Updates immediately on being changed
    abstract updateImmediate(newState: TState): void;

    // Determines whether or not to hide this config in the menu
    // Unnecessary if the config type is NONE.
    abstract get hidden(): boolean;

    abstract get configType(): ConfigType;

    abstract get superText(): string | undefined;

    static ConfigTypeEnum: {[configTypeName: string]: ConfigType} = {
        NONE: 0,
        BOOLEAN: 1,
        STRING: 2,
        COLOR: 3,
        DROPDOWN: 4
    };
}
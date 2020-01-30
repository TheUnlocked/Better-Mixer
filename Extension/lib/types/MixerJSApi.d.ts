interface Node { eventListeners(): ((event: Event) => void)[] }

declare type React = typeof import('react');
declare type ReactDOM = typeof import('react-dom');

type ToggleProps = {
    checked: boolean;
    onChange(this: ToggleProps, e: React.ChangeEvent<HTMLInputElement>): void;
};
type ColorPickerProps = {
    label: string;
    fallback: string;
    value: string;
    onChange(v: string): void;
};
type SelectProps = {
    label: string;
    options: {key: string; value: string}[];
    value: string;
    onChange(v: string): void;
    children(p: {key: string; value: string}): React.ReactNode;
};
type TextInputProps = {
    label: string;
    value: string;
    onChange(v: string): void;
};
type IconProps = {
    set?: string;
    icon: string;
    title?: string;
    size?: string;
    style?: string;
};

declare const mixerUi: {
    SimpleColorPicker: React.ComponentClass<ColorPickerProps>;
    Select: React.ComponentClass<SelectProps>;
    BuiTextInput: React.ComponentClass<TextInputProps>;
    Toggle: React.ComponentClass<ToggleProps>;
    BuiIcon: React.ComponentClass<IconProps>;
};
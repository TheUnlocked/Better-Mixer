interface Node { eventListeners(): ((event: Event) => void)[] }

declare type React = typeof import('react');
declare type ReactDOM = typeof import('react-dom');

type ToggleProps = {
    checked: boolean;
    onChange(this: ToggleProps, e: React.ChangeEvent<HTMLInputElement>): void;
};
type ColorPickerProps = {
    label: string;
    value: string;
    onChange(this: ColorPickerProps, v: string): void;
};
type SelectProps = {
    label: string;
    options: {key: string; value: string}[];
    selectedOptionKey: string;
    onValueChange(v: { key: string; value: string }): void;
    menuContainer: HTMLDivElement;
    // children(p: {key: string; value: string}): React.ReactNode;
};
type TextInputProps = {
    label: string;
    value: string;
    onValueChange(v: string): void;
};
type IconProps = {
    // set?: string;
    // icon: string;
    // title?: string;
    // size?: string;
    // style?: string;
};

declare const mds: {
    MdsColorPicker: React.ComponentClass<ColorPickerProps>;
    MdsDropdown: React.ComponentClass<SelectProps>;
    MdsInput: React.ComponentClass<TextInputProps>;
    MdsToggle: React.ComponentClass<ToggleProps>;
    MdsChevronupIcon: React.ComponentClass<IconProps>;
};
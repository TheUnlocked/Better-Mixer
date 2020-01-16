interface Node { eventListeners(): ((event: Event) => void)[] }

declare const mixerUi: {
    SimpleColorPicker: React.ComponentClass<{
        label: string;
        fallback: string;
        value: string;
        onChange(v: string): void;
    }>;
    Select: React.ComponentClass<{
        label: string;
        options: {key: string; value: string}[];
        value: string;
        children: (p: {key: string; value: string}) => React.ReactNode;
        onChange(v: string): void;
    }>;
    BuiTextInput: React.ComponentClass<{
        label: string;
        value: string;
        onChange(v: string): void;
    }>;
};
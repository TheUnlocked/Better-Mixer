export const findMax = <T>(array: T[], callback: (value: T, index: number, array: T[]) => number): T | undefined => {
    if (array.length <= 1) {
        return array[0];
    }
    let bestSoFar = array[0];
    let bestValueSoFar = callback(array[0], 0, array);
    for (let i = 1; i < array.length; i++) {
        const newValue = callback(array[i], i, array);
        if (newValue > bestValueSoFar) {
            bestSoFar = array[i];
            bestValueSoFar = newValue;
        }
    }
    return bestSoFar;
};

export const findMin = <T>(array: T[], callback: (value: T, index: number, array: T[]) => number): T | undefined => {
    if (array.length <= 1) {
        return array[0];
    }
    let bestSoFar = array[0];
    let bestValueSoFar = callback(array[0], 0, array);
    for (let i = 1; i < array.length; i++) {
        const newValue = callback(array[i], i, array);
        if (newValue < bestValueSoFar) {
            bestSoFar = array[i];
            bestValueSoFar = newValue;
        }
    }
    return bestSoFar;
};
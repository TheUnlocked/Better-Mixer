export const sliceMany = (str: string, slicePoints: number[]) => {
    const accumulated: string[] = [];
    let lastPoint = 0;
    for (const nextPoint of slicePoints) {
        accumulated.push(str.slice(lastPoint, nextPoint));
        lastPoint = nextPoint;
    }
    accumulated.push(str.slice(lastPoint));
    return accumulated;
};
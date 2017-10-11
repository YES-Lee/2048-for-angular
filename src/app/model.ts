export class NumberItem {
    value: number;
    isNew: boolean;

    constructor(value: number, isNew: boolean) {
        this.isNew = isNew;
        this.value = value;
    }
}

export class Position {
    row: number;
    column: number;
    value: number;

    constructor(row, col, value) {
        this.row = row;
        this.column = col;
        this.value = value;
    }
}

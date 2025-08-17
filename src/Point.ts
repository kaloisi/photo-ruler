

class Point {
    x : number 
    y : number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    getTopLeft(point : Point) : Point {
        return new Point(Math.min(this.x, point.x), Math.min(this.y, point.y));
    }

    getBottomRight(point : Point) : Point {
        return new Point(Math.min(this.x, point.x), Math.min(this.y, point.y));
    }

    add(x : number, y : number) : Point {
        return new Point(this.x + x, this.y + y);
    }
}


export default Point
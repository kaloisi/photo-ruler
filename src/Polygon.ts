import Line from './Line';
import Point from './Point';

class Polygon {
    lines: Line[];
    vertices: Point[];

    constructor(lines: Line[]) {
        this.lines = lines;
        this.vertices = this.extractOrderedVertices();
    }

    // Extract vertices in order from the connected lines
    private extractOrderedVertices(): Point[] {
        if (this.lines.length === 0) return [];

        const vertices: Point[] = [];
        const usedLines = new Set<Line>();

        // Start with first line
        let currentLine = this.lines[0];
        usedLines.add(currentLine);
        vertices.push(currentLine.start);
        let currentPoint = currentLine.end;

        while (usedLines.size < this.lines.length) {
            vertices.push(currentPoint);

            // Find next connected line
            let foundNext = false;
            for (const line of this.lines) {
                if (usedLines.has(line)) continue;

                if (this.pointsEqual(line.start, currentPoint)) {
                    usedLines.add(line);
                    currentPoint = line.end;
                    foundNext = true;
                    break;
                } else if (this.pointsEqual(line.end, currentPoint)) {
                    usedLines.add(line);
                    currentPoint = line.start;
                    foundNext = true;
                    break;
                }
            }

            if (!foundNext) break;
        }

        return vertices;
    }

    private pointsEqual(p1: Point, p2: Point, tolerance: number = 5): boolean {
        return Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance;
    }

    // Calculate the centroid (center) of the polygon
    getCentroid(): Point {
        if (this.vertices.length === 0) return new Point(0, 0);

        let sumX = 0;
        let sumY = 0;
        for (const vertex of this.vertices) {
            sumX += vertex.x;
            sumY += vertex.y;
        }
        return new Point(sumX / this.vertices.length, sumY / this.vertices.length);
    }

    // Calculate area in pixels using Shoelace formula
    getAreaInPixels(): number {
        const n = this.vertices.length;
        if (n < 3) return 0;

        let area = 0;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += this.vertices[i].x * this.vertices[j].y;
            area -= this.vertices[j].x * this.vertices[i].y;
        }
        return Math.abs(area / 2);
    }

    // Calculate area in square feet given a ruler line and its length in inches
    getAreaInSquareFeet(ruler: Line, rulerInches: number): number {
        const pixPerInch = ruler.getLineLengthInPixels() / rulerInches;
        const pixPerFoot = pixPerInch * 12;
        const areaInPixels = this.getAreaInPixels();
        return areaInPixels / (pixPerFoot * pixPerFoot);
    }

    // Format area as string
    formatArea(ruler: Line, rulerInches: number): string {
        const sqFt = this.getAreaInSquareFeet(ruler, rulerInches);
        return `${sqFt.toFixed(1)} sq ft`;
    }

    // Check if this polygon contains a specific line
    containsLine(line: Line): boolean {
        return this.lines.includes(line);
    }

    // Move entire polygon by offset
    moveBy(dx: number, dy: number): Polygon {
        const movedLines = this.lines.map(line => {
            return new Line(
                new Point(line.start.x + dx, line.start.y + dy),
                new Point(line.end.x + dx, line.end.y + dy),
                line.name
            );
        });
        return new Polygon(movedLines);
    }

    // Static method to detect polygons from a set of lines
    static detectPolygons(lines: Line[], tolerance: number = 5): Polygon[] {
        const polygons: Polygon[] = [];
        const usedLines = new Set<Line>();

        for (const startLine of lines) {
            if (usedLines.has(startLine)) continue;

            // Try to find a closed polygon starting from this line
            const polygon = Polygon.findClosedPolygon(startLine, lines, tolerance);
            if (polygon && polygon.lines.length >= 3) {
                polygon.lines.forEach(l => usedLines.add(l));
                polygons.push(polygon);
            }
        }

        return polygons;
    }

    // Find a closed polygon starting from a given line
    private static findClosedPolygon(startLine: Line, allLines: Line[], tolerance: number): Polygon | null {
        const path: Line[] = [startLine];
        const visited = new Set<Line>([startLine]);
        const startPoint = startLine.start;
        let currentPoint = startLine.end;

        const search = (): boolean => {
            // Check if we can close the polygon
            if (path.length >= 3 && Polygon.prototype.pointsEqual.call({}, currentPoint, startPoint, tolerance)) {
                return true;
            }

            // Find next connected line
            for (const line of allLines) {
                if (visited.has(line)) continue;

                let nextPoint: Point | null = null;
                if (Polygon.prototype.pointsEqual.call({}, line.start, currentPoint, tolerance)) {
                    nextPoint = line.end;
                } else if (Polygon.prototype.pointsEqual.call({}, line.end, currentPoint, tolerance)) {
                    nextPoint = line.start;
                }

                if (nextPoint) {
                    path.push(line);
                    visited.add(line);
                    const prevPoint = currentPoint;
                    currentPoint = nextPoint;

                    if (search()) {
                        return true;
                    }

                    // Backtrack
                    path.pop();
                    visited.delete(line);
                    currentPoint = prevPoint;
                }
            }

            return false;
        };

        if (search()) {
            return new Polygon(path);
        }

        return null;
    }
}

export default Polygon;

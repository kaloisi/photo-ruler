import Point from './Point'


class Line {
      start : Point
      end : Point
      name : string

      constructor(start: Point, end: Point, name : string = "Line") {
        this.start = start
        this.end = end
        this.name = name
      }
    

      toPath() : string {
        return "M" + this.start.x + " " + this.start.y + " L" + this.end.x + " " + this.end.y
      }
    
      getLineLengthInPixels() : number {
        let h = Math.abs(this.start.y - this.end.y)
        let w = Math.abs(this.start.x - this.end.x)
        return Math.round(Math.sqrt(Math.pow(h,2) + Math.pow(w,2)))
      }

      hasValidLength() : boolean {
        let length = this.getLineLengthInPixels()
        return length > 10
      }

      
      split(lines : Line[]) : Line[] {
        // Collect all intersection points
        const intersectionPoints: Point[] = [];

        for (const other of lines) {
            const intersection = this.getIntersection(other);
            if (intersection != null) {
                intersectionPoints.push(intersection);
            }
        }

        if (intersectionPoints.length === 0) {
            return [this];
        }

        // Sort intersection points by distance from start
        intersectionPoints.sort((a, b) => {
            const distA = Math.pow(a.x - this.start.x, 2) + Math.pow(a.y - this.start.y, 2);
            const distB = Math.pow(b.x - this.start.x, 2) + Math.pow(b.y - this.start.y, 2);
            return distA - distB;
        });

        // Create line segments between points
        const results: Line[] = [];
        let previousPoint = this.start;
        const baseName = this.name;

        for (let i = 0; i < intersectionPoints.length; i++) {
            const newLine = new Line(previousPoint, intersectionPoints[i], `${baseName}.${i + 1}`);
            if (newLine.hasValidLength()) {
                results.push(newLine);
            }
            previousPoint = intersectionPoints[i];
        }

        // Add final segment
        const finalLine = new Line(previousPoint, this.end, `${baseName}.${intersectionPoints.length + 1}`);
        if (finalLine.hasValidLength()) {
            results.push(finalLine);
        }

        return results;
      }

      getTopLeft() : Point {
        return new Point(
          Math.min(this.start.x, this.end.x),
          Math.min(this.start.y, this.end.y)
        );
      }

      getBottomRight() : Point {
        return new Point(
          Math.max(this.start.x, this.end.x),
          Math.max(this.start.y, this.end.y)
        );
      }

      getBoundingBox(line : Line) {
        const points = [ 
            this.getTopLeft(),
            this.getBottomRight(),
            line.getTopLeft(),
            line.getBottomRight()
        ]
        
        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;

        for (const point of points) {
          minX = Math.min(minX, point.x)
          minY = Math.min(minY, point.y)
          maxX = Math.max(maxX, point.x)
          maxY = Math.max(maxY, point.y)
        }

        return new Line(
          new Point(minX, minY),
          new Point(maxX, maxY),
          'Box'
        )
      }

      // Check if a point lies on this line segment (within a small tolerance)
      private isPointOnSegment(point: Point, tolerance: number = 0.001) : boolean {
        const minX = Math.min(this.start.x, this.end.x) - tolerance;
        const maxX = Math.max(this.start.x, this.end.x) + tolerance;
        const minY = Math.min(this.start.y, this.end.y) - tolerance;
        const maxY = Math.max(this.start.y, this.end.y) + tolerance;

        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
      }

      getIntersection(line: Line) : Point | null {
        // Line AB represented as a1x + b1y = c1
        const a1 = this.end.y - this.start.y;
        const b1 = this.start.x - this.end.x;
        const c1 = a1 * this.start.x + b1 * this.start.y;

        // Line CD represented as a2x + b2y = c2
        const a2 = line.end.y - line.start.y;
        const b2 = line.start.x - line.end.x;
        const c2 = a2 * line.start.x + b2 * line.start.y;

        const determinant = a1 * b2 - a2 * b1;

        if (determinant === 0) {
            // Lines are parallel
            return null;
        }

        const x = (b2 * c1 - b1 * c2) / determinant;
        const y = (a1 * c2 - a2 * c1) / determinant;
        const intersection = new Point(x, y);

        // Check if intersection point lies on BOTH line segments
        if (this.isPointOnSegment(intersection) && line.isPointOnSegment(intersection)) {
            return intersection;
        }

        return null;
      }
      
      getMidPoint() : Point {
        return new Point(
          this.start.x + (this.end.x - this.start.x)/2,
          this.start.y + (this.end.y - this.start.y)/2
        )
      }
    
      getLineLengthInInches(ruler: Line, rulerInches: number) : number {
        const pixPerInch = ruler.getLineLengthInPixels() / rulerInches
        return Math.round(this.getLineLengthInPixels() / pixPerInch)
      }

      formatFeetInches(totalInches: number) : string {
        const feet = Math.floor(totalInches / 12)
        const inches = totalInches % 12
        if (inches === 0) {
          return `${feet}'`
        }
        return `${feet}'${inches}"`
      }

      getLineLabel(ruler: Line, rulerInches: number, isDragLine: boolean = false) : string {
        const totalInches = this.getLineLengthInInches(ruler, rulerInches)
        const formatted = this.formatFeetInches(totalInches)
        return (isDragLine ? '' : (this.name + ' ')) + formatted
      }
}

export default Line
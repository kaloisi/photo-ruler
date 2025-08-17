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
        let results : Line[] = [ this ]
        let done = false

        while (!done) {
            done = true
            for (const line of lines) {
              results = results.flatMap((next: Line) => {
                console.log(next, line)
                let intersection = next.getIntersection(line)
                console.log("Intersection", intersection)
                if (!intersection || intersection == null) 
                  return [next]

                return [
                  new Line(next.start, intersection),
                  new Line(intersection, next.end)
                ];
                done = false
              });
            }
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
        } else {
            const x = (b2 * c1 - b1 * c2) / determinant;
            const y = (a1 * c2 - a2 * c1) / determinant;

            const box = this.getBoundingBox(line);
            //console.log("Box", box)
            if (x > box.start.x && x < box.end.x && y > box.start.y && y < box.end.y) {
              return new Point(x, y);
            } else {
              return null
            }
        }
      }
      
      getMidPoint() : Point {
        return new Point(
          this.start.x + (this.end.x - this.start.x)/2,
          this.start.y + (this.end.y - this.start.y)/2
        )
      }
    
      getLineLengthInFeet(ruler: Line, inFeet: number) : number {
        let pixPerFoot = ruler.getLineLengthInPixels() / inFeet
        return Math.round(this.getLineLengthInPixels() / pixPerFoot)
      }

      getLineLabel(ruler: Line, inFeet: number, isDragLine: boolean = false) : string {
        return(isDragLine ? '' : (this.name + ' ')) + this.getLineLengthInFeet(ruler, inFeet)
      }
}

export default Line
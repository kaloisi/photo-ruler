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
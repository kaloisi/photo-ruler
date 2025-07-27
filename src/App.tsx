import { Box, createTheme, FormGroup, Slider, TextField, ThemeProvider } from '@mui/material';
import './App.css'
import React, { type JSX } from 'react';

const myTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

class Line {
  start : Point
  end : Point
  constructor(start: Point, end: Point) {
    this.start = start
    this.end = end
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
}

class Point {
  x : number 
  y : number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

interface AppProps {
}

interface AppState {
  url: string,
  scaleInFeet: number,
  updateRuler: boolean,
  ruler: Line
  scale: Line
  dragLine: Line
  isDragging: boolean
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      isDragging: false,
      updateRuler: true,
      scaleInFeet: 20,
      url: "/plot.png",
      ruler: new Line(new Point(0,0), new Point(0, 100)),
      scale: new Line(new Point(0,0), new Point(100, 100)),
      dragLine: new Line(new Point(0,0), new Point(100, 0)),
    }
  }
  
  mouseMove(e : React.MouseEvent) {
    if (this.state.isDragging) {
      console.log("Recorded", e)
      this.setState({
        dragLine: new Line(
          this.state.dragLine?.start,
          new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
        )
      })
    }
  }
  recordClick(e : React.MouseEvent) {
    console.log("Recorded", e)
    this.setState({
      isDragging: true,
      dragLine: new Line(
        new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
        new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
      )
    })
  }

  saveChange() {
    if (this.state.updateRuler) {
      this.setState({ 
        isDragging:false,
        ruler: this.state.dragLine,
        updateRuler: false
      })
    } else {
      this.setState({ 
        isDragging:false,
        scale: this.state.dragLine,
      })
    }
  }

  renderLine(line : Line, color: string) {
    let path = line.toPath()
    let midPoint = line.getMidPoint()
    let textStyle = {
        fill: 'green',
        fontSize: 24
        
    }
    return (
      <>
        <path style={{
          stroke: color,
          strokeWidth: 4,
        }} d={path}/>
        <text style={textStyle}
           x={midPoint.x}
           y={midPoint.y}>{line.getLineLengthInPixels()}px</text>
        <text style={textStyle}
           x={midPoint.x}
           y={midPoint.y + 30}>{line.getLineLengthInFeet(this.state.ruler, this.state.scaleInFeet)}ft</text>
      </>
    )
  }

  updateScaleInFeet(e: React.ChangeEvent<HTMLInputElement>) {
    let newValue = e.target.value
    this.setState({
      scaleInFeet: parseFloat(newValue)
    })
  }
  

  render() {
    return (<>
    <ThemeProvider theme={myTheme}>
      <Box sx={{ flexGrow: 1 }}>
      <FormGroup>
          <Slider aria-label="Image Scale" value={10} />
          <TextField value={this.state.url}/>
          <TextField value={this.state.scaleInFeet} onChange={(e) => this.updateScaleInFeet(e)}/>
        </FormGroup>
      </Box>

        <div>
            <svg width={1526} height={1526}
              onMouseDown={(e) => this.recordClick(e)}
              onMouseMove={(e) => this.mouseMove(e)}
              onMouseUp={(e) => this.saveChange()}
              >
                <image href={this.state.url} width='1536' />
                {this.state.isDragging && this.renderLine(this.state.dragLine, 'red')}
                {!this.state.isDragging && this.renderLine(this.state.ruler, 'blue')}
                {!this.state.isDragging && this.renderLine(this.state.scale, 'green')}
            </svg>
        </div>
      </ThemeProvider>
    </>)
  }
}

export default App

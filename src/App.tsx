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
          new Point(e.clientX, e.clientY),
        )
      })
    }
  }
  recordClick(e : React.MouseEvent) {
    console.log("Recorded", e)
    this.setState({
      isDragging: true,
      dragLine: new Line(
        new Point(e.clientX, e.clientY),
        new Point(e.clientX, e.clientY),
      )
    })
  }

  renderLine(line : Line | null, color: string) {
    let path = line?.toPath()
    return (
      <path style={{
        stroke: color,
        strokeWidth: 2,
      }} d={path}/>
    )
  }

  render() {
    return (<>
    <ThemeProvider theme={myTheme}>
      <Box sx={{ flexGrow: 1 }}>
      <FormGroup>
          <Slider aria-label="Image Scale" value={10} />
          <TextField value={this.state.url}/>
          <TextField value={this.state.scaleInFeet}/>
        </FormGroup>
      </Box>

        <div>
            <svg width={1526} height={1526}
              onMouseDown={(e) => this.recordClick(e)}
              onMouseMove={(e) => this.mouseMove(e)}
              onMouseUp={() => this.setState({ isDragging:false })}
              >
                <image href={this.state.url} width='1536' />
                {this.renderLine(this.state.dragLine, 'red')}
                {this.renderLine(this.state.ruler, 'blue')}
                {this.renderLine(this.state.scale, 'green')}
            </svg>
        </div>
      </ThemeProvider>
    </>)
  }
}

export default App

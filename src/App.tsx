import { Box, Button, FormGroup, TextField, styled } from '@mui/material';
import './App.css'
import React from 'react';
import Line from './Line'
import Point from './Point'



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

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      isDragging: false,
      updateRuler: true,
      scaleInFeet: 20,
      url: "/floorplan.png",
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

  updateScaleInFeet(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    let newValue = e.target.value
    this.setState({
      scaleInFeet: parseFloat(newValue)
    })
  }
  
  setFile(file: FileList | null) {
    console.log(file)
    if (file != null && file.length > 0) {
      this.setState({
        url: URL.createObjectURL(file[0])
      })
    }
  }

  renderSvg() {
    return (
        <svg width={1526} height={1526}
            onMouseDown={(e) => this.recordClick(e)}
            onMouseMove={(e) => this.mouseMove(e)}
            onMouseUp={() => this.saveChange()}
            >
              <image href={this.state.url} width='1536' />
              {this.state.isDragging && this.renderLine(this.state.dragLine, 'red')}
              {!this.state.isDragging && this.renderLine(this.state.ruler, 'blue')}
              {!this.state.isDragging && this.renderLine(this.state.scale, 'green')}
          </svg>
    )
  }

  render() {
    return (<>
      <Box sx={{ flexGrow: 1 }}>
        <FormGroup>
          <TextField 
            label="Scale"
            value={this.state.scaleInFeet} 
            onChange={(e) => this.updateScaleInFeet(e)}/>
          <Button
            component="label"
            role={undefined}
            tabIndex={-1}
            variant="contained">
            Upload File
            <VisuallyHiddenInput
              type="file"
              onChange={(e) => this.setFile(e.target.files)}
            />
        </Button>
        </FormGroup>
      </Box>
        <div>
            {this.state.url && this.renderSvg()}
        </div>
    </>)
  }
}

export default App

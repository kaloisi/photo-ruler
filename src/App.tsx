import { Button } from '@mui/material';
import './App.css'
import React, { type FormEvent } from 'react';
import Line from './Line'
import Point from './Point'
import AppDrawer from './AppDrawer';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';

interface AppProps {}

interface AppState {
  url: string,
  scaleInFeet: number,
  backgroundOpacity: number,
  updateRuler: boolean,
  ruler: Line,
  lines: Line[],
  dragLine: Line,
  isDragging: boolean,
  showDrawer: boolean
}


class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      isDragging: false,
      updateRuler: true,
      scaleInFeet: 20,
      backgroundOpacity: 33,
      url: "/floorplan.png",
      ruler: new Line(new Point(0,0), new Point(0, 100), 'ruler'),
      lines: [],
      dragLine: new Line(new Point(0,0), new Point(100, 0), ''),
      showDrawer: true
    }
  }
  
  mouseMove(e : React.MouseEvent) {
    if (this.state.isDragging) {
      console.log("Recorded", e)
      this.setState({
        dragLine: new Line(
          this.state.dragLine?.start,
          new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
          this.state.dragLine.name
        )
      })
    }
  }

  startDrawing(e : React.MouseEvent) {
    //console.log("Recorded", e)
    let line = new Line(
      new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
      new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
      this.state.updateRuler ? 'Ruler' : ('Line ' + (this.state.lines.length + 1))
    )

    this.setState({
      isDragging: true,
      dragLine: line
    })
  }

  saveLine() {
    if (this.state.updateRuler) {
      this.setState({ 
        isDragging:false,
        ruler: this.state.dragLine,
        updateRuler: false
      })
    } else {
      this.setState({ 
        isDragging:false,
        lines: this.state.lines.concat(this.state.dragLine),
      })
    }
  }

  updateScaleInFeet(scaleInFeet : number) {
    //console.log("Updating scale to", scaleInFeet)
    this.setState({
      scaleInFeet: scaleInFeet
    })
  }
  
  setBackground(file: FileList | null) {
    console.log(file)
    if (file != null && file.length > 0) {
      this.setState({
        url: URL.createObjectURL(file[0])
      })
    }
  }

  openMenu(e: FormEvent<HTMLLabelElement>) {
    //console.log("openMenu called with", e)
    this.setState({ showDrawer: true })
  }

  closeMenu() {
    this.setState({ showDrawer: false })
  }

  renameLine(line: Line, newName: string) {
    let copy = this.state.lines.map((l) => {
      if (l === line) {
        l.name = newName;
      }
      return l;
    });

    this.setState({
      lines: copy
    });
  }

  deleteLine(line: Line) {
    let copy = this.state.lines.filter((l) => l !== line);
    this.setState({
      lines: copy
    });
  }

  resetRuler() {
    console.log("Resetting ruler")
    this.closeMenu()
    this.setState({
      updateRuler: true,
    });
  }

  renderAppDrawer() {
    if (this.state.showDrawer === false) {
      return (<div/>);
    }
    return (
      <AppDrawer
        width={400}
        scaleInFeet={this.state.scaleInFeet}
        backgroundOpacity={this.state.backgroundOpacity}
        open={this.state.showDrawer}
        lines={this.state.lines}
        /** actions */
        onClose={() => this.closeMenu()}
        onLineNameChange={(line, newName) => this.renameLine(line, newName)}
        onLineDelete={(line) => this.deleteLine(line)}
        onScaleChange={(scaleInFeet) => this.updateScaleInFeet(scaleInFeet)}
        onUpload={(fileList) => this.setBackground(fileList)}
        onUpdateRuler={() => this.resetRuler()}
        onOpacityChange={(newOpacity) => this.setState({ backgroundOpacity: newOpacity })}
      />
    );
  }

  render() {
    return (<>

      { this.renderAppDrawer() }
      <Button onClick={() => this.setState({ showDrawer: true })}> <MenuOpenIcon /> Open Drawer</Button>
      <div>
          {this.state.url && this.renderSvg()}
      </div>
    </>)
  }

  renderLines() {
    //console.log(this.state.lines)
    return this.state.lines.map((line : Line, index: number) => {
      return this.renderLine(line, 'black', '' + index)
    })
  }

  renderSvg() {
    return (
        <svg width={1526} height={1526}
            onMouseDown={(e) => this.startDrawing(e)}
            onMouseMove={(e) => this.mouseMove(e)}
            onMouseUp={() => this.saveLine()}
            >
              <image href={this.state.url} width='1536' opacity={this.state.backgroundOpacity / 100}/>
              
              {this.renderLine(this.state.ruler, 'gray', 'ruler')}
              {this.renderLines()}
              {this.state.isDragging && this.renderLine(this.state.dragLine, 'red', 'dragLine')}
          </svg>
    )
  }

  renderLine(line : Line, color: string, index: string) {
    let path = line.toPath()
    let midPoint = line.getMidPoint()
    let textStyle = {
        fill: color,
        fontSize: 24
    }
    let opacity = line !== this.state.dragLine && this.state.isDragging ? 0.33 : 1.0;

    return (
      <g key={"line" + index}>
        <path style={{
          stroke: color,
          strokeWidth: 5,
          opacity: opacity
        }} d={path}/>
        <text style={textStyle}
        x={midPoint.x}
        y={midPoint.y + 50}>{line.getLineLabel(this.state.ruler, this.state.scaleInFeet, this.state.dragLine === line)}'
        </text>
      </g>
    )
  }
}

export default App

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
  showDrawer: boolean,
  focus: Line | null
}

const NO_LINE = new Line(new Point(-200,-200), new Point(0, 0), 'No Line');

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      isDragging: false,
      updateRuler: true,
      scaleInFeet: 20,
      backgroundOpacity: 33,
      url: "/floorplan.png",
      ruler: NO_LINE,
      lines: [],
      dragLine: NO_LINE,
      showDrawer: true,
      focus: null
    }
  }
  
  mouseMove(e : React.MouseEvent) {
    if (this.state.isDragging) {
      //console.log("Recorded", e)
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
    // cancel if its too small
    if(!this.state.dragLine.hasValidLength()) {
      this.setState({ 
        isDragging:false,
        dragLine: NO_LINE
      })
    } else if (this.state.updateRuler) {
      this.setState({ 
        isDragging:false,
        ruler: this.state.dragLine,
        updateRuler: false
      })
    } else {
      this.setState({ 
        isDragging: false,
        lines: this.state.lines.concat(this.state.dragLine),
        dragLine: NO_LINE
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
    if (file != null && file.length > 0) {
      let url = URL.createObjectURL(file[0])
      this.setState({
        url: url
      })
    }
  }

  openMenu(_: FormEvent<HTMLLabelElement>) {
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
        onLineSplit={(line) => this.splitLine(line)}
        onLineFocus={(line) => this.setState({ focus: line })}
      />
    );
  }

  splitLine(line: Line): void {
    const results = this.state.lines.filter((l) => l !== line);
    const splitLines = line.split(results);
    console.log("Splitting line", line, "into", splitLines);
    this.setState({
      lines: results.concat(splitLines)
    })
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
        <svg width={1024} height={1024}
            onMouseDown={(e) => this.startDrawing(e)}
            onMouseMove={(e) => this.mouseMove(e)}
            onMouseUp={() => this.saveLine()}
            >
              <image href={this.state.url} opacity={this.state.backgroundOpacity / 100} />

              {this.renderLine(this.state.ruler, 'gray', 'ruler')}
              {this.renderLines()}
              {this.state.isDragging && this.renderLine(this.state.dragLine, 'red', 'dragLine')}
          </svg>
    )
  }

  renderLine(line : Line, color: string, index: string) {
    if (line == NO_LINE) return (<></>)

    let path = line.toPath()
    let midPoint = line.getMidPoint()
    let textStyle = {
        fill: color,
        fontSize: 24
    }
    let opacity = line !== this.state.dragLine && this.state.isDragging ? 0.33 : 1.0;
    
    let strokeWidth = this.state.focus === null ?  5 : 
                        this.state.focus === line ? 8 : 1;
    return (
      <g key={"line" + index}>
        <path style={{
          stroke: color,
          strokeWidth: strokeWidth,
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

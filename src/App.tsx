import { Box, IconButton, styled } from '@mui/material';
import './App.css'
import React, { type FormEvent } from 'react';
import Line from './Line'
import Point from './Point'
import AppDrawer from './AppDrawer';
import MenuIcon from '@mui/icons-material/Menu';

const DRAWER_WIDTH = 300;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${DRAWER_WIDTH}px`,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
      },
    },
  ],
}));

interface AppProps {}

type EditMode = 'none' | 'drawing' | 'movingLine' | 'movingStart' | 'movingEnd';

interface AppState {
  url: string,
  imageWidth: number,
  imageHeight: number,
  scaleInInches: number,
  backgroundOpacity: number,
  updateRuler: boolean,
  ruler: Line,
  lines: Line[],
  dragLine: Line,
  isDragging: boolean,
  showDrawer: boolean,
  focus: Line | null,
  editMode: EditMode,
  editingLine: Line | null,
  dragOffset: Point | null
}

const NO_LINE = new Line(new Point(-200,-200), new Point(0, 0), 'No Line');

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      isDragging: false,
      updateRuler: true,
      scaleInInches: 240,
      backgroundOpacity: 33,
      url: "/floorplan.png",
      imageWidth: 1024,
      imageHeight: 1024,
      ruler: NO_LINE,
      lines: [],
      dragLine: NO_LINE,
      showDrawer: true,
      focus: null,
      editMode: 'none',
      editingLine: null,
      dragOffset: null
    }
  }
  
  mouseMove(e : React.MouseEvent) {
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;

    if (this.state.editMode === 'drawing') {
      this.setState({
        dragLine: new Line(
          this.state.dragLine?.start,
          new Point(mouseX, mouseY),
          this.state.dragLine.name
        )
      })
    } else if (this.state.editMode === 'movingLine' && this.state.editingLine && this.state.dragOffset) {
      // Move entire line - maintain the same length and angle
      const newStart = new Point(
        mouseX - this.state.dragOffset.x,
        mouseY - this.state.dragOffset.y
      );
      const dx = this.state.editingLine.end.x - this.state.editingLine.start.x;
      const dy = this.state.editingLine.end.y - this.state.editingLine.start.y;
      const newEnd = new Point(newStart.x + dx, newStart.y + dy);

      this.updateEditingLine(newStart, newEnd);
    } else if (this.state.editMode === 'movingStart' && this.state.editingLine) {
      // Move just the start point
      const newStart = new Point(mouseX, mouseY);
      this.updateEditingLine(newStart, this.state.editingLine.end);
    } else if (this.state.editMode === 'movingEnd' && this.state.editingLine) {
      // Move just the end point
      const newEnd = new Point(mouseX, mouseY);
      this.updateEditingLine(this.state.editingLine.start, newEnd);
    }
  }

  updateEditingLine(newStart: Point, newEnd: Point) {
    if (!this.state.editingLine) return;

    const updatedLine = new Line(newStart, newEnd, this.state.editingLine.name);
    const updatedLines = this.state.lines.map(l =>
      l === this.state.editingLine ? updatedLine : l
    );

    this.setState({
      lines: updatedLines,
      editingLine: updatedLine,
      focus: updatedLine
    });
  }

  startDrawing(e : React.MouseEvent) {
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;
    const clickPoint = new Point(mouseX, mouseY);

    // Check if clicking on a focused line's endpoints or body
    if (this.state.focus) {
      const ENDPOINT_RADIUS = 12;
      const startDist = this.distanceToPoint(clickPoint, this.state.focus.start);
      const endDist = this.distanceToPoint(clickPoint, this.state.focus.end);

      if (startDist <= ENDPOINT_RADIUS) {
        // Clicked on start endpoint
        e.stopPropagation();
        this.setState({
          editMode: 'movingStart',
          editingLine: this.state.focus
        });
        return;
      }

      if (endDist <= ENDPOINT_RADIUS) {
        // Clicked on end endpoint
        e.stopPropagation();
        this.setState({
          editMode: 'movingEnd',
          editingLine: this.state.focus
        });
        return;
      }

      // Check if clicking on the line body
      const lineDist = this.distanceToLine(clickPoint, this.state.focus);
      if (lineDist <= 10) {
        // Clicked on line body - start moving entire line
        e.stopPropagation();
        const offset = new Point(
          mouseX - this.state.focus.start.x,
          mouseY - this.state.focus.start.y
        );
        this.setState({
          editMode: 'movingLine',
          editingLine: this.state.focus,
          dragOffset: offset
        });
        return;
      }
    }

    // Default: start drawing a new line
    let line = new Line(
      new Point(mouseX, mouseY),
      new Point(mouseX, mouseY),
      this.state.updateRuler ? 'Ruler' : ('Line ' + (this.state.lines.length + 1))
    )

    this.setState({
      isDragging: true,
      editMode: 'drawing',
      dragLine: line
    })
  }

  distanceToPoint(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  distanceToLine(point: Point, line: Line): number {
    const A = point.x - line.start.x;
    const B = point.y - line.start.y;
    const C = line.end.x - line.start.x;
    const D = line.end.y - line.start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = line.start.x;
      yy = line.start.y;
    } else if (param > 1) {
      xx = line.end.x;
      yy = line.end.y;
    } else {
      xx = line.start.x + param * C;
      yy = line.start.y + param * D;
    }

    return Math.sqrt(Math.pow(point.x - xx, 2) + Math.pow(point.y - yy, 2));
  }

  saveLine() {
    // Handle different edit modes
    if (this.state.editMode === 'movingLine' || this.state.editMode === 'movingStart' || this.state.editMode === 'movingEnd') {
      // Finished editing - just reset edit state
      this.setState({
        editMode: 'none',
        editingLine: null,
        dragOffset: null
      });
      return;
    }

    // Drawing mode - save new line
    if (!this.state.dragLine.hasValidLength()) {
      this.setState({
        isDragging: false,
        editMode: 'none',
        dragLine: NO_LINE
      })
    } else if (this.state.updateRuler) {
      this.setState({
        isDragging: false,
        editMode: 'none',
        ruler: this.state.dragLine,
        updateRuler: false
      })
    } else {
      this.setState({
        isDragging: false,
        editMode: 'none',
        lines: this.state.lines.concat(this.state.dragLine),
        dragLine: NO_LINE
      })
    }
  }

  updateScaleInInches(scaleInInches : number) {
    this.setState({
      scaleInInches: scaleInInches
    })
  }
  
  setBackground(file: FileList | null) {
    if (file != null && file.length > 0) {
      let url = URL.createObjectURL(file[0])
      // Load image to get its natural dimensions
      const img = new Image()
      img.onload = () => {
        this.setState({
          url: url,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight
        })
      }
      img.src = url
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
    return (
      <AppDrawer
        width={DRAWER_WIDTH}
        scaleInInches={this.state.scaleInInches}
        backgroundOpacity={this.state.backgroundOpacity}
        open={this.state.showDrawer}
        lines={this.state.lines}
        /** actions */
        onClose={() => this.closeMenu()}
        onLineNameChange={(line, newName) => this.renameLine(line, newName)}
        onLineDelete={(line) => this.deleteLine(line)}
        onScaleChange={(scaleInInches) => this.updateScaleInInches(scaleInInches)}
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
    return (
      <Box sx={{ display: 'flex' }}>
        {this.renderAppDrawer()}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={() => this.setState({ showDrawer: true })}
          sx={{
            position: 'fixed',
            left: 8,
            top: 8,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            ...(this.state.showDrawer && { display: 'none' }),
          }}
        >
          <MenuIcon />
        </IconButton>
        <Main open={this.state.showDrawer}>
          <div className="svg-container">
            {this.state.url && this.renderSvg()}
          </div>
        </Main>
      </Box>
    )
  }

  renderLines() {
    //console.log(this.state.lines)
    return this.state.lines.map((line : Line, index: number) => {
      return this.renderLine(line, 'black', '' + index)
    })
  }

  renderSvg() {
    return (
        <svg width={this.state.imageWidth} height={this.state.imageHeight}
            onMouseDown={(e) => this.startDrawing(e)}
            onMouseMove={(e) => this.mouseMove(e)}
            onMouseUp={() => this.saveLine()}
            >
              <image href={this.state.url} opacity={this.state.backgroundOpacity / 100} />

              {this.renderLine(this.state.ruler, 'gray', 'ruler')}
              {this.renderLines()}
              {this.state.editMode === 'drawing' && this.renderLine(this.state.dragLine, 'red', 'dragLine')}
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
    let opacity = line !== this.state.dragLine && this.state.editMode === 'drawing' ? 0.33 : 1.0;
    const isFocused = this.state.focus === line;

    let strokeWidth = this.state.focus === null ?  5 :
                        isFocused ? 8 : 1;

    const ENDPOINT_RADIUS = 8;

    return (
      <g key={"line" + index}>
        <path
          style={{
            stroke: color,
            strokeWidth: strokeWidth,
            opacity: opacity,
            cursor: isFocused ? 'move' : 'default'
          }}
          d={path}
        />
        {/* Show endpoints when line is focused */}
        {isFocused && (
          <>
            <circle
              cx={line.start.x}
              cy={line.start.y}
              r={ENDPOINT_RADIUS}
              fill={color}
              stroke="white"
              strokeWidth={2}
              style={{ cursor: 'pointer', opacity: 0.8 }}
            />
            <circle
              cx={line.end.x}
              cy={line.end.y}
              r={ENDPOINT_RADIUS}
              fill={color}
              stroke="white"
              strokeWidth={2}
              style={{ cursor: 'pointer', opacity: 0.8 }}
            />
          </>
        )}
        <text style={textStyle}
        x={midPoint.x}
        y={midPoint.y + 50}>{line.getLineLabel(this.state.ruler, this.state.scaleInInches, this.state.dragLine === line)}
        </text>
      </g>
    )
  }
}

export default App

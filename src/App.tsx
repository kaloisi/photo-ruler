import { Box, IconButton, styled } from '@mui/material';
import './App.css'
import React, { type FormEvent } from 'react';
import Line from './Line'
import Point from './Point'
import Polygon from './Polygon'
import AppDrawer from './AppDrawer';
import MenuIcon from '@mui/icons-material/Menu';

const DRAWER_WIDTH = 300;
const SNAP_DISTANCE = 15;

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

type EditMode = 'none' | 'drawing' | 'movingLine' | 'movingStart' | 'movingEnd' | 'movingPolygon';

interface AppState {
  url: string,
  imageWidth: number,
  imageHeight: number,
  imageScale: number,
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
  editingPolygon: Polygon | null,
  dragOffset: Point | null,
  editingLineName: Line | null,
  editingLineNameValue: string
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
      imageScale: 1,
      ruler: NO_LINE,
      lines: [],
      dragLine: NO_LINE,
      showDrawer: true,
      focus: null,
      editMode: 'none',
      editingLine: null,
      editingPolygon: null,
      dragOffset: null,
      editingLineName: null,
      editingLineNameValue: ''
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
    } else if (this.state.editMode === 'movingPolygon' && this.state.editingPolygon && this.state.dragOffset) {
      // Move entire polygon
      const currentCentroid = this.state.editingPolygon.getCentroid();
      const newCentroidX = mouseX - this.state.dragOffset.x;
      const newCentroidY = mouseY - this.state.dragOffset.y;
      const dx = newCentroidX - currentCentroid.x;
      const dy = newCentroidY - currentCentroid.y;

      // Move all lines in the polygon
      const movedPolygon = this.state.editingPolygon.moveBy(dx, dy);

      // Update state with moved lines
      const updatedLines = this.state.lines.map(line => {
        const polygonLineIndex = this.state.editingPolygon!.lines.findIndex(pl => pl === line);
        if (polygonLineIndex !== -1) {
          return movedPolygon.lines[polygonLineIndex];
        }
        return line;
      });

      this.setState({
        lines: updatedLines,
        editingPolygon: movedPolygon
      });
    }
  }

  updateEditingLine(newStart: Point, newEnd: Point) {
    if (!this.state.editingLine) return;

    const oldLine = this.state.editingLine;
    const updatedLine = new Line(newStart, newEnd, oldLine.name);

    // Find lines connected to the moved endpoints and update them too
    let updatedLines = this.state.lines.map(l => {
      if (l === oldLine) return updatedLine;

      // Check if this line shares an endpoint with the moved line
      let lineStart = l.start;
      let lineEnd = l.end;
      let needsUpdate = false;

      // If we moved the start point
      if (this.state.editMode === 'movingStart' || this.state.editMode === 'movingLine') {
        if (this.distanceToPoint(l.start, oldLine.start) < SNAP_DISTANCE) {
          lineStart = newStart;
          needsUpdate = true;
        }
        if (this.distanceToPoint(l.end, oldLine.start) < SNAP_DISTANCE) {
          lineEnd = newStart;
          needsUpdate = true;
        }
      }

      // If we moved the end point
      if (this.state.editMode === 'movingEnd' || this.state.editMode === 'movingLine') {
        if (this.distanceToPoint(l.start, oldLine.end) < SNAP_DISTANCE) {
          lineStart = newEnd;
          needsUpdate = true;
        }
        if (this.distanceToPoint(l.end, oldLine.end) < SNAP_DISTANCE) {
          lineEnd = newEnd;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        return new Line(lineStart, lineEnd, l.name);
      }
      return l;
    });

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

      // Clicked outside the focused line - clear focus
      this.setState({ focus: null });
    }

    // Check if clicking on a line that's part of a polygon
    const polygons = Polygon.detectPolygons(this.state.lines);
    for (const polygon of polygons) {
      for (const line of polygon.lines) {
        const lineDist = this.distanceToLine(clickPoint, line);
        if (lineDist <= 10) {
          // Clicked on a polygon line - start moving entire polygon
          e.stopPropagation();
          const offset = new Point(
            mouseX - polygon.getCentroid().x,
            mouseY - polygon.getCentroid().y
          );
          this.setState({
            editMode: 'movingPolygon',
            editingPolygon: polygon,
            dragOffset: offset,
            focus: line
          });
          return;
        }
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
      dragLine: line,
      focus: null
    })
  }

  distanceToPoint(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  // Find the nearest existing endpoint within snap distance
  findSnapPoint(point: Point, excludeLine?: Line): Point | null {
    let nearestPoint: Point | null = null;
    let nearestDist = SNAP_DISTANCE;

    // Check all line endpoints
    for (const line of this.state.lines) {
      if (excludeLine && line === excludeLine) continue;

      const startDist = this.distanceToPoint(point, line.start);
      const endDist = this.distanceToPoint(point, line.end);

      if (startDist < nearestDist) {
        nearestDist = startDist;
        nearestPoint = line.start;
      }
      if (endDist < nearestDist) {
        nearestDist = endDist;
        nearestPoint = line.end;
      }
    }

    // Also check ruler endpoints
    if (this.state.ruler !== NO_LINE) {
      const rulerStartDist = this.distanceToPoint(point, this.state.ruler.start);
      const rulerEndDist = this.distanceToPoint(point, this.state.ruler.end);
      if (rulerStartDist < nearestDist) {
        nearestDist = rulerStartDist;
        nearestPoint = this.state.ruler.start;
      }
      if (rulerEndDist < nearestDist) {
        nearestDist = rulerEndDist;
        nearestPoint = this.state.ruler.end;
      }
    }

    return nearestPoint;
  }

  // Find all lines that share an endpoint with the given point
  findConnectedLines(point: Point, excludeLine?: Line): Line[] {
    const connected: Line[] = [];
    for (const line of this.state.lines) {
      if (excludeLine && line === excludeLine) continue;

      if (this.distanceToPoint(point, line.start) < SNAP_DISTANCE ||
          this.distanceToPoint(point, line.end) < SNAP_DISTANCE) {
        connected.push(line);
      }
    }
    return connected;
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
      // Finished editing - apply snapping to endpoints
      if (this.state.editingLine) {
        const snapStart = this.findSnapPoint(this.state.editingLine.start, this.state.editingLine);
        const snapEnd = this.findSnapPoint(this.state.editingLine.end, this.state.editingLine);

        if (snapStart || snapEnd) {
          const newStart = snapStart || this.state.editingLine.start;
          const newEnd = snapEnd || this.state.editingLine.end;
          const snappedLine = new Line(newStart, newEnd, this.state.editingLine.name);

          const updatedLines = this.state.lines.map(l =>
            l === this.state.editingLine ? snappedLine : l
          );

          this.setState({
            lines: updatedLines,
            editMode: 'none',
            editingLine: null,
            dragOffset: null,
            focus: snappedLine
          });
          return;
        }
      }

      this.setState({
        editMode: 'none',
        editingLine: null,
        dragOffset: null
      });
      return;
    }

    if (this.state.editMode === 'movingPolygon') {
      this.setState({
        editMode: 'none',
        editingPolygon: null,
        dragOffset: null
      });
      return;
    }

    // Drawing mode - save new line with snapping
    if (!this.state.dragLine.hasValidLength()) {
      this.setState({
        isDragging: false,
        editMode: 'none',
        dragLine: NO_LINE
      })
    } else if (this.state.updateRuler) {
      // Apply snapping to ruler
      const snapStart = this.findSnapPoint(this.state.dragLine.start);
      const snapEnd = this.findSnapPoint(this.state.dragLine.end);
      const snappedRuler = new Line(
        snapStart || this.state.dragLine.start,
        snapEnd || this.state.dragLine.end,
        this.state.dragLine.name
      );

      this.setState({
        isDragging: false,
        editMode: 'none',
        ruler: snappedRuler,
        updateRuler: false
      })
    } else {
      // Apply snapping to new line
      const snapStart = this.findSnapPoint(this.state.dragLine.start);
      const snapEnd = this.findSnapPoint(this.state.dragLine.end);
      const snappedLine = new Line(
        snapStart || this.state.dragLine.start,
        snapEnd || this.state.dragLine.end,
        this.state.dragLine.name
      );

      this.setState({
        isDragging: false,
        editMode: 'none',
        lines: this.state.lines.concat(snappedLine),
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
        imageScale={this.state.imageScale}
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
        onImageScaleChange={(newScale) => this.setState({ imageScale: newScale })}
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

  renderPolygons() {
    const polygons = Polygon.detectPolygons(this.state.lines);

    return polygons.map((polygon, index) => {
      const centroid = polygon.getCentroid();
      const areaText = polygon.formatArea(this.state.ruler, this.state.scaleInInches);
      const isEditing = this.state.editingPolygon === polygon;

      // Create polygon path for fill
      const pathPoints = polygon.vertices.map((v, i) =>
        (i === 0 ? 'M' : 'L') + v.x + ' ' + v.y
      ).join(' ') + ' Z';

      return (
        <g key={'polygon' + index}>
          {/* Semi-transparent fill for the polygon */}
          <path
            d={pathPoints}
            fill="rgba(100, 149, 237, 0.2)"
            stroke="none"
            style={{
              cursor: 'move',
              opacity: isEditing ? 0.4 : 0.2
            }}
          />
          {/* Area label at centroid */}
          <text
            x={centroid.x}
            y={centroid.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: 'darkblue',
              fontSize: 18,
              fontWeight: 'bold',
              pointerEvents: 'none'
            }}
          >
            {areaText}
          </text>
        </g>
      );
    });
  }

  renderSvg() {
    const scaledWidth = this.state.imageWidth * this.state.imageScale;
    const scaledHeight = this.state.imageHeight * this.state.imageScale;

    return (
        <svg width={scaledWidth} height={scaledHeight}
            onMouseDown={(e) => this.startDrawing(e)}
            onMouseMove={(e) => this.mouseMove(e)}
            onMouseUp={() => this.saveLine()}
            >
              <image
                href={this.state.url}
                opacity={this.state.backgroundOpacity / 100}
                width={scaledWidth}
                height={scaledHeight}
              />

              {/* Render polygons first (behind lines) */}
              {this.renderPolygons()}
              {this.renderLine(this.state.ruler, 'gray', 'ruler')}
              {this.renderLines()}
              {this.state.editMode === 'drawing' && this.state.dragLine.hasValidLength() && this.renderLine(this.state.dragLine, 'red', 'dragLine')}
          </svg>
    )
  }

  renderLine(line : Line, color: string, index: string) {
    if (line == NO_LINE) return (<></>)

    let midPoint = line.getMidPoint()
    let textStyle = {
        fill: color,
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 500
    }
    let opacity = line !== this.state.dragLine && this.state.editMode === 'drawing' ? 0.33 : 1.0;
    const isFocused = this.state.focus === line;

    let strokeWidth = this.state.focus === null ?  5 :
                        isFocused ? 8 : 1;

    const ENDPOINT_RADIUS = 8;

    // Calculate line angle in degrees
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Flip text if it would be upside down
    if (angle > 90 || angle < -90) {
      angle += 180;
    }

    // Get label text - only show name when focused (in edit mode)
    const isEditingName = this.state.editingLineName === line;
    const labelText = line.getLineLabel(this.state.ruler, this.state.scaleInInches, this.state.dragLine === line, isFocused);

    // Estimate label dimensions (approximate based on font size and text length)
    const charWidth = 10;
    const displayText = isEditingName ? this.state.editingLineNameValue : labelText;
    const labelWidth = Math.max(displayText.length * charWidth + 16, 60); // padding, min width
    const labelHeight = 24;
    const cornerRadius = 6;

    // Calculate the half-width along the line direction for where line segments should stop
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    const halfLabelWidth = labelWidth / 2 + 4; // small gap

    // Calculate unit vector along the line
    const ux = dx / lineLength;
    const uy = dy / lineLength;

    // Points where lines connect to the label rectangle
    const labelLeftX = midPoint.x - ux * halfLabelWidth;
    const labelLeftY = midPoint.y - uy * halfLabelWidth;
    const labelRightX = midPoint.x + ux * halfLabelWidth;
    const labelRightY = midPoint.y + uy * halfLabelWidth;

    return (
      <g key={"line" + index}>
        {/* First line segment: from start to label */}
        <line
          x1={line.start.x}
          y1={line.start.y}
          x2={labelLeftX}
          y2={labelLeftY}
          style={{
            stroke: color,
            strokeWidth: strokeWidth,
            opacity: opacity,
            cursor: isFocused ? 'move' : 'default'
          }}
        />
        {/* Second line segment: from label to end */}
        <line
          x1={labelRightX}
          y1={labelRightY}
          x2={line.end.x}
          y2={line.end.y}
          style={{
            stroke: color,
            strokeWidth: strokeWidth,
            opacity: opacity,
            cursor: isFocused ? 'move' : 'default'
          }}
        />

        {/* Label group with rotation */}
        <g transform={`translate(${midPoint.x}, ${midPoint.y}) rotate(${angle})`}>
          {/* Rounded rectangle background */}
          <rect
            x={-labelWidth / 2}
            y={-labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="white"
            stroke={color}
            strokeWidth={1.5}
            opacity={opacity}
            style={{ cursor: isFocused ? 'text' : 'default' }}
            onClick={(e) => {
              if (isFocused && !isEditingName) {
                e.stopPropagation();
                this.setState({
                  editingLineName: line,
                  editingLineNameValue: line.name
                });
              }
            }}
          />
          {/* Label text or input */}
          {isEditingName ? (
            <foreignObject
              x={-labelWidth / 2}
              y={-labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
            >
              <input
                type="text"
                value={this.state.editingLineNameValue}
                onChange={(e) => this.setState({ editingLineNameValue: e.target.value })}
                onBlur={() => {
                  this.renameLine(line, this.state.editingLineNameValue);
                  this.setState({ editingLineName: null, editingLineNameValue: '' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    this.renameLine(line, this.state.editingLineNameValue);
                    this.setState({ editingLineName: null, editingLineNameValue: '' });
                  } else if (e.key === 'Escape') {
                    this.setState({ editingLineName: null, editingLineNameValue: '' });
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'center',
                  fontSize: 18,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 500,
                  color: color,
                  outline: 'none',
                  padding: 0
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </foreignObject>
          ) : (
            <text
              style={{...textStyle, cursor: isFocused ? 'text' : 'default'}}
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={opacity}
              onClick={(e) => {
                if (isFocused) {
                  e.stopPropagation();
                  this.setState({
                    editingLineName: line,
                    editingLineNameValue: line.name
                  });
                }
              }}
            >
              {labelText}
            </text>
          )}
        </g>

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
      </g>
    )
  }
}

export default App

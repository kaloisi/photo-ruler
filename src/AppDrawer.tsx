import React from 'react';
import {  Drawer , TextField, Button, styled, Stack, Slider } from '@mui/material';
import { List, ListItem } from '@mui/material';
import Line from './Line'
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import Border from './Border';


type AppDrawerProps = {
    scaleInInches: number;
    backgroundOpacity: number;
    headerText?: string;
    open: boolean;
    onClose: () => void;
    lines: Line[];
    width: number;
    onLineNameChange?: (line: Line, newName: string) => void;
    onLineDelete?: (line: Line) => void;
    onLineSplit?: (line: Line) => void;
    onUpload?: (fileList: FileList | null) => void;
    onScaleChange?: (newScale: number) => void;
    onOpacityChange?: (newOpacity: number) => void;
    onUpdateRuler?: () => void;
    onLineFocus?: (line: Line | null) => void;
};

// Parse feet'inches" format (e.g., "10'3\"" or "10'" or "10'3") to total inches
function parseFeetInches(value: string): number | null {
    const trimmed = value.trim();

    // Match patterns like: 10'3", 10', 10'3, 10, etc.
    const match = trimmed.match(/^(\d+)(?:'(\d*)(?:")?)?$/);
    if (match) {
        const feet = parseInt(match[1], 10) || 0;
        const inches = parseInt(match[2], 10) || 0;
        return feet * 12 + inches;
    }

    // Try parsing as just a number (interpreted as feet)
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
        return Math.round(num * 12);
    }

    return null;
}

// Format total inches as feet'inches" (e.g., 123 -> "10'3\"")
function formatFeetInches(totalInches: number): string {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    if (inches === 0) {
        return `${feet}'`;
    }
    return `${feet}'${inches}"`;
}

type AppDrawerState = {
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


class AppDrawer extends React.Component<AppDrawerProps, AppDrawerState> {
    
    render() {
        return (
            <Drawer anchor="left" open={this.props.open} onClose={() => this.props.onClose()} >
                <Stack 
                    direction="column" 
                    spacing={2} 
                    width={this.props.width}
                    >
                    <Border title="Actions">
                        <Button
                            component="label"
                            role={undefined}
                            tabIndex={-1}
                            variant="contained"
                            startIcon={<WallpaperIcon />}
                            >
                            Set Background
                            <VisuallyHiddenInput
                            type="file"
                            onChange={(e) => this.props.onUpload?.(e.target.files)}
                            />
                        </Button>
                        <Button
                            component="label"
                            role={undefined}
                            tabIndex={-1}
                            startIcon={<DesignServicesIcon />}
                            variant="contained"
                            onClick={() => this.props.onUpdateRuler?.()}>
                            Draw Ruler
                        </Button>
                    </Border>
                    
                    <Border title="Ruler length (e.g., 10'3&quot;)">
                        <TextField
                            variant='standard'
                            type="text"
                            placeholder="10'3&quot;"
                            value={formatFeetInches(this.props.scaleInInches)}
                            onChange={(e) => {
                                const inches = parseFeetInches(e.target.value);
                                if (inches !== null && inches > 0) {
                                    this.props.onScaleChange?.(inches);
                                }
                            }}
                        />
                    </Border>

                    <Border title="Background Opacity">
                        <Slider 
                            aria-label="Background Opacity" 
                            value={this.props.backgroundOpacity} 
                            onChange={(_, newValue: number) => this.props.onOpacityChange?.(newValue)} />
                    </Border>
                    {this.props.lines.length > 0 && this.renderItems()}                    
                </Stack>
            </Drawer>
        );
    }

    hasInterections(line : Line) : boolean {
        for (const next of this.props.lines) {
            if (line == next) continue;

            const intersection = line.getIntersection(next);
            if (intersection != null) {
                console.log(`Found intersection between ${next.name} and ${line.name} at `, intersection);
                return true;
            }
        }
        return false
    }

    renderItems() {
        return (
            <Border title='Lines'>
                <List>
                    {this.props.lines.map((line, index: number) => (
                    <ListItem key={'ListItem' + index}>
                        <TextField
                            value={line.name}
                            onChange={(e) => this.props.onLineNameChange?.(line, e.target.value)}
                            onFocus={() => this.props.onLineFocus?.(line)}
                            onBlur={() => this.props.onLineFocus?.(null)}
                        />
                        <Button onClick={() => this.props.onLineSplit?.(line)} disabled={!this.hasInterections(line)}><ContentCutIcon /></Button>
                        <Button onClick={() => this.props.onLineDelete?.(line)}><DeleteIcon /></Button>
                    </ListItem>
                    ))}
                </List>
            </Border>
        )
    }

}
export default AppDrawer;
import React from 'react';
import {  Drawer , TextField, Button, styled, Stack, Slider, IconButton, Divider, Box } from '@mui/material';
import { List, ListItem } from '@mui/material';
import Line from './Line'
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
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
    scaleInput: string;
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

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));


class AppDrawer extends React.Component<AppDrawerProps, AppDrawerState> {
    constructor(props: AppDrawerProps) {
        super(props);
        this.state = {
            scaleInput: formatFeetInches(props.scaleInInches)
        };
    }

    componentDidUpdate(prevProps: AppDrawerProps) {
        // Update local state when prop changes from parent (but not while user is typing)
        if (prevProps.scaleInInches !== this.props.scaleInInches) {
            const currentParsed = parseFeetInches(this.state.scaleInput);
            if (currentParsed !== this.props.scaleInInches) {
                this.setState({ scaleInput: formatFeetInches(this.props.scaleInInches) });
            }
        }
    }

    handleScaleBlur = () => {
        const inches = parseFeetInches(this.state.scaleInput);
        if (inches !== null && inches > 0) {
            this.props.onScaleChange?.(inches);
            this.setState({ scaleInput: formatFeetInches(inches) });
        } else {
            // Reset to current valid value if input is invalid
            this.setState({ scaleInput: formatFeetInches(this.props.scaleInInches) });
        }
    };

    render() {
        return (
            <Drawer
                variant="persistent"
                anchor="left"
                open={this.props.open}
                sx={{
                    width: this.props.width,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: this.props.width,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <DrawerHeader>
                    <IconButton onClick={() => this.props.onClose()}>
                        <ChevronLeftIcon />
                    </IconButton>
                </DrawerHeader>
                <Divider />
                <Stack
                    direction="column"
                    spacing={2}
                    width={this.props.width}
                    sx={{ padding: 1 }}
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
                            value={this.state.scaleInput}
                            onChange={(e) => this.setState({ scaleInput: e.target.value })}
                            onBlur={this.handleScaleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    this.handleScaleBlur();
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

    hasIntersections(line : Line) : boolean {
        for (const other of this.props.lines) {
            if (line === other) continue;

            const intersection = line.getIntersection(other);
            if (intersection != null) {
                return true;
            }
        }
        return false;
    }

    renderItems() {
        return (
            <Border title='Lines'>
                <List disablePadding>
                    {this.props.lines.map((line, index: number) => (
                    <ListItem key={'ListItem' + index} disablePadding sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.5 }}>
                            <TextField
                                size="small"
                                variant="standard"
                                value={line.name}
                                onChange={(e) => this.props.onLineNameChange?.(line, e.target.value)}
                                onFocus={() => this.props.onLineFocus?.(line)}
                                onBlur={() => this.props.onLineFocus?.(null)}
                                sx={{ flexGrow: 1 }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => this.props.onLineSplit?.(line)}
                                disabled={!this.hasIntersections(line)}
                                title="Split at intersections"
                            >
                                <ContentCutIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => this.props.onLineDelete?.(line)}
                                title="Delete line"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </ListItem>
                    ))}
                </List>
            </Border>
        )
    }

}
export default AppDrawer;
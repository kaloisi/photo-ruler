import React from 'react';
import {  Drawer , TextField, Button, styled, Stack, Slider } from '@mui/material';
import { List, ListItem } from '@mui/material';
import Line from './Line'
import DeleteIcon from '@mui/icons-material/Delete';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import Border from './Border';

type AppDrawerProps = {
    scaleInFeet: number;
    backgroundOpacity: number;
    headerText?: string;
    open: boolean;
    onClose: () => void;
    lines: Line[];
    width: number;
    onLineNameChange?: (line: Line, newName: string) => void;
    onLineDelete?: (line: Line) => void;
    onUpload?: (fileList: FileList | null) => void;
    onScaleChange?: (newScale: number) => void;
    onOpacityChange?: (newOpacity: number) => void;
    onUpdateRuler?: () => void;
};

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
                            Draw Scale Line
                        </Button>
                    </Border>
                    
                    <Border title="Scale in feet">
                        <TextField
                            variant='standard'
                            type="number"
                            InputProps={{ inputProps: { min: 1, step: 1 } }}
                            value={this.props.scaleInFeet}
                            onChange={(e) => this.props.onScaleChange?.(parseFloat(e.target.value))}
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

    renderItems() {
        return (
            <Border title='Lines'>
                <List>
                    {this.props.lines.map((line, index: number) => (
                    <ListItem key={'ListItem' + index}>
                        <TextField
                            value={line.name}
                            onChange={(e) => this.props.onLineNameChange?.(line, e.target.value)}
                        />
                        <Button onClick={() => this.props.onLineDelete?.(line)}><DeleteIcon /></Button>
                    </ListItem>
                    ))}
                </List>
            </Border>
        )
    }

}
export default AppDrawer;
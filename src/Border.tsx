import React, { type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface BorderProps {
    children: ReactNode;
    title: string
}

class Border extends React.Component<BorderProps> {
    static defaultProps = {
        borderColor: '#1976d2',
        borderWidth: 2,
        borderRadius: 8,
        padding: 2,
    };

    render() {
       return ( 
        <Box sx={{ p: 2 }}>
            <Box sx={{ position: 'relative', border: '1px solid #ccc', borderRadius: 2, p: 3, mt: 4 }}>
            {/* Title sits on the border */}
            <Typography
                variant="subtitle2"
                sx={{
                position: 'absolute',
                top: -12,
                left: 16,
                bgcolor: 'background.paper', // ensures text covers the border
                px: 1,
                }}
            >
                {this.props.title}
            </Typography>
            {this.props.children}
            </Box>
        </Box>
        )
    }
}

export default Border;
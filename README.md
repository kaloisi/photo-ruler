# Photo Ruler

This application lets you measure relative distances within a photo using a custom reference ruler. For example, if you have a floor plan of your house that doesn’t include room dimensions, you can use this tool to calculate them.

To do this, you upload the photo into the application and draw a ruler along a wall whose real-world length you know. In the Open Drawer popover, you then set the actual length of that ruler (for example, in feet). Once the reference distance is defined, any additional line you draw on the photo will automatically display its measured distance based on that scale.

**Live Demo:** [https://kaloisi.github.io/photo-ruler/](https://kaloisi.github.io/photo-ruler/)

## Features

- Upload any image (floor plans, maps, blueprints, etc.)
- Set a reference ruler with a known measurement to calibrate the scale
- Draw multiple measurement lines on the image
- Automatic distance calculation based on the calibrated scale
- Adjust background image opacity for better visibility
- Rename and delete measurement lines
- Split lines at intersection points

## Tech Stack

- React 19
- TypeScript
- Vite
- Material UI (MUI)
- Vitest for testing

## Prerequisites

- Node.js 20 or higher
- npm

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/kaloisi/photo-ruler.git
cd photo-ruler
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Building for Production

Build the project:

```bash
npm run build
```

The build artifacts will be generated in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run debug` | Run tests in watch mode |
| `npm run deploy` | Deploy to GitHub Pages (manual) |

## How to Use

1. **Set Background**: Click "Set Background" to upload your image (floor plan, map, etc.)
2. **Draw Ruler**: Click "Draw Ruler" and draw a line on your image that represents a known distance
3. **Set Scale**: Enter the actual measurement (in feet) that your ruler line represents
4. **Measure**: Click and drag to draw measurement lines anywhere on the image
5. **View Results**: Each line will display its calculated length based on your calibrated scale

## Deployment

The project automatically deploys to GitHub Pages when changes are pushed to the `main` branch via GitHub Actions.

For manual deployment:

```bash
npm run deploy
```

## License

This project is private.

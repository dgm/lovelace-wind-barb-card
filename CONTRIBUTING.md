# Contributing to Wind Barb Card

Thank you for your interest in contributing! This project welcomes contributions from the community.

## Development Setup

1. **Prerequisites**
   - Node.js 18+
   - npm or yarn

2. **Setup**
   ```bash
   git clone https://github.com/dgm/lovelace-wind-barb-card.git
   cd lovelace-wind-barb-card
   npm install
   ```

3. **Development**
   ```bash
   npm run dev    # Watch mode for development
   npm run build  # Production build
   npm run lint   # Code linting
   ```

## Project Structure

```
src/
├── wind-barb-card.ts          # Main card component
├── types/index.ts             # TypeScript interfaces
├── utils/
│   ├── wind-barbs.ts          # Wind barb SVG rendering
│   └── ha-api.ts              # Home Assistant API integration
└── components/
    ├── wind-chart.ts          # Standard line chart
    └── wind-barb-chart.ts     # Wind barb timeline chart
```

## Code Style

- Use TypeScript with strict mode
- Follow existing code patterns
- Run `npm run lint` before committing
- Use meaningful commit messages

## Testing

Test your changes with Home Assistant:

1. Copy `dist/wind-barb-card.js` to your HA `www` folder
2. Add to Lovelace resources
3. Test with real wind sensor data

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with clear description

## Issues

- Use GitHub issues for bugs and feature requests
- Include Home Assistant version and browser info
- Provide example configuration when relevant
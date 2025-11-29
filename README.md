# Wind Barb Card for Home Assistant

A custom Lovelace card for displaying wind data with meteorological wind barbs and time-series graphs.

## Features

- **Wind Barbs**: Meteorological standard wind barbs showing direction and speed
- **Time-Series Graphs**: Interactive charts for wind speed and direction over time
- **Configurable Time Periods**: Display data for last 24h, 48h, or custom periods
- **Multiple Units**: Support for mph, kph, m/s, and knots
- **Professional Appearance**: Weather station-style design
- **Real-time Updates**: Automatic data refresh every 5 minutes

## Installation

### HACS (Recommended)
1. Add this repository to HACS as a custom repository
2. Install "Wind Barb Card" from HACS
3. Add the card to your Lovelace configuration

### Manual Installation
1. Download `wind-barb-card.js` from the latest release
2. Copy to `config/www/community/lovelace-wind-barb-card/`
3. Add to your Lovelace resources:

```yaml
resources:
  - url: /hacsfiles/lovelace-wind-barb-card/wind-barb-card.js
    type: module
```

## Configuration

### Basic Configuration
```yaml
type: custom:wind-barb-card
name: "Wind Conditions"
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
```

### Full Configuration
```yaml
type: custom:wind-barb-card
name: "Weather Station Wind"
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
wind_gust_entity: sensor.gw2000b_wind_gust
time_period: 24
units: "mph"
show_barbs: true
show_graph: true
barb_size: 40
graph_height: 300
theme:
  primary_color: "#1976d2"
  secondary_color: "#ff9800"
  background_color: "#ffffff"
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | **Required** | `custom:wind-barb-card` |
| `name` | string | "Wind Barb Card" | Card title |
| `wind_direction_entity` | string | **Required** | Entity ID for wind direction (degrees) |
| `wind_speed_entity` | string | **Required** | Entity ID for wind speed |
| `wind_gust_entity` | string | Optional | Entity ID for wind gusts |
| `time_period` | number | 24 | Hours of historical data to display |
| `units` | string | "m/s" | Display units: "mph", "kph", "m/s", "knots" |
| `show_barbs` | boolean | true | Show wind barbs for current conditions |
| `show_graph` | boolean | true | Show time-series graph |
| `barb_timeline` | boolean | false | Show wind barbs on timeline (instead of line chart) |
| `barb_size` | number | 40 | Size of wind barbs in pixels |
| `graph_height` | number | 300 | Height of the graph in pixels |
| `theme.primary_color` | string | "#1976d2" | Primary color for wind speed |
| `theme.secondary_color` | string | "#ff9800" | Secondary color for wind direction |
| `theme.background_color` | string | Auto | Card background color |

## Wind Speed Units

The card automatically detects and converts between different wind speed units:
- **m/s** (meters per second)
- **mph** (miles per hour) 
- **kph** or **km/h** (kilometers per hour)
- **knots** or **kt** (nautical miles per hour)

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
npm install
npm run dev    # Development build with watch
npm run build  # Production build
npm run lint   # Code linting
```

### Project Structure
```
src/
├── wind-barb-card.ts          # Main card component
├── types/
│   └── index.ts               # TypeScript interfaces
├── utils/
│   ├── wind-barbs.ts          # Wind barb SVG rendering
│   └── ha-api.ts              # Home Assistant API integration
└── components/
    └── wind-chart.ts          # Chart.js wrapper component
```

## License

MIT License - see LICENSE file for details.
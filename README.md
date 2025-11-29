# Wind Barb Card for Home Assistant

A custom Lovelace card for displaying wind data as a meteogram with meteorological wind barbs on a timeline.

## Features

- **Wind Barb Meteogram**: Timeline display with meteorological standard wind barbs showing direction and speed over time
- **Configurable Time Periods**: Display data for last 24h, 48h, or custom periods
- **Multiple Units**: Support for mph, kph, m/s, and knots
- **Professional Appearance**: Weather station-style meteogram design
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
name: "Wind Meteogram"
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
```

### Full Configuration
```yaml
type: custom:wind-barb-card
name: "Weather Station Wind Meteogram"
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
wind_gust_entity: sensor.gw2000b_wind_gust
time_period: 24
units: "mph"
barb_size: 40
graph_height: 300
barb_stem_length: 25
barb_flag_length: 12
barb_line_width: 2
graph_line_width: 2
time_format: "24"
show_legend: true
show_y_axis_label: false
theme:
  primary_color: "#1976d2"
  secondary_color: "#ff9800"
  background_color: "#ffffff"
  text_color: "#333333"
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
| `barb_size` | number | 40 | Size of wind barbs in pixels |
| `graph_height` | number | 300 | Height of the meteogram in pixels |
| `barb_stem_length` | number | 25 | Length of wind barb stem in pixels |
| `barb_flag_length` | number | 12 | Length of wind barb flags in pixels |
| `barb_line_width` | number | 2 | Width of wind barb lines in pixels |
| `graph_line_width` | number | 2 | Width of graph lines in pixels |
| `time_format` | string | "24" | Time display format: "12" or "24" |
| `show_legend` | boolean | true | Show colored legend above chart |
| `show_y_axis_label` | boolean | false | Show y-axis label text |
| `theme.primary_color` | string | "#1976d2" | Primary color for wind speed |
| `theme.secondary_color` | string | "#ff9800" | Secondary color for wind gusts |
| `theme.background_color` | string | Auto | Card background color |
| `theme.text_color` | string | Auto | Card title text color |

## Theming Examples

The card supports extensive theming and customization options. Here are three different styling examples:

![Theming Examples](docs/image.png)

### Blue Theme with Gusts
```yaml
type: custom:wind-barb-card
name: Weather Station Wind Meteogram
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
wind_gust_entity: sensor.gw2000b_wind_gust
time_period: 24
units: mph
barb_size: 40
graph_height: 300
theme:
  primary_color: '#0d47a1'
  secondary_color: '#37474f'
  background_color: '#e3f2fd'
  text_color: '#1a237e'
```

### Orange Theme (Minimal)
```yaml
type: custom:wind-barb-card
name: Wind Meteogram
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
theme:
  primary_color: '#d84315'
  secondary_color: '#8e24aa'
  background_color: '#fff3e0'
  text_color: '#bf360c'
```

### Green Theme (Custom Styling)
```yaml
type: custom:wind-barb-card
name: Weather Station Wind Meteogram
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
wind_gust_entity: sensor.gw2000b_wind_gust
time_period: 24
show_legend: false
show_y_axis_label: true
units: knots
barb_size: 40
graph_height: 300
barb_stem_length: 30
barb_flag_length: 10
barb_line_width: 1
graph_line_width: 1
time_format: '12'
theme:
  primary_color: '#2e7d32'
  secondary_color: '#bf360c'
  background_color: '#f1f8e9'
  text_color: '#1b5e20'
```

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
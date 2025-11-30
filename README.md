# Wind Barb Card for Home Assistant

A custom Lovelace card for displaying wind data as a meteogram with meteorological wind barbs on a timeline.

## Features

- **Wind Barb Meteogram**: Timeline display with meteorological standard wind barbs showing direction and speed over time
- **NWS Forecast Integration**: Combines local sensor data with National Weather Service gridded forecast data
- **Visual Forecast Differentiation**: Dashed lines for forecast data, solid lines for historical data, with present moment indicator
- **Interactive Forecast Toggle**: Button to show/hide forecast data for easy comparison
- **Interactive Time Controls**: Quick preset buttons (6h, 12h, 24h, 48h) with optimal wind barb spacing
- **Adaptive Sampling**: Windowed representative sampling prevents wind direction averaging artifacts
- **Real-time Smoothing Control**: Interactive slider to adjust temporal smoothing (1-60 minutes)
- **Multiple Units**: Support for mph, kph, m/s, and knots
- **Professional Appearance**: Weather station-style meteogram design with smooth loading transitions
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

### Interactive Configuration with Forecast
```yaml
type: custom:wind-barb-card
name: "Interactive Wind Meteogram"
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
wind_gust_entity: sensor.gw2000b_wind_gust
forecast_entity: sensor.nws_gridded_forecast
forecast_hours: 48
show_time_presets: true
show_window_control: true
time_range:
  start: "-24h"
  end: "now"
  sampling: "windowed_representative"
  window_size: "15min"
units: "mph"
barb_size: 40
graph_height: 300
theme:
  primary_color: "#1976d2"
  secondary_color: "#ff9800"
  background_color: "#ffffff"
  text_color: "#333333"
```

### Legacy Configuration
```yaml
type: custom:wind-barb-card
name: "Simple Wind Meteogram"
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
time_period: 24  # Still supported
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | **Required** | `custom:wind-barb-card` |
| `name` | string | "Wind Barb Card" | Card title |
| `wind_direction_entity` | string | **Required** | Entity ID for wind direction (degrees) |
| `wind_speed_entity` | string | **Required** | Entity ID for wind speed |
| `wind_gust_entity` | string | Optional | Entity ID for wind gusts |
| `forecast_entity` | string | Optional | Entity ID for NWS gridded forecast data |
| `forecast_hours` | number | 48 | Number of forecast hours to display |
| `time_period` | number | 24 | Hours of historical data to display (legacy) |
| `time_range` | object | See below | Advanced time control configuration |
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
| `show_time_presets` | boolean | false | Show interactive time range preset buttons |
| `show_window_control` | boolean | false | Show smoothing control slider |
| `time_presets` | array | See below | Custom preset button configurations |
| `theme.primary_color` | string | "#1976d2" | Primary color for wind speed |
| `theme.secondary_color` | string | "#ff9800" | Secondary color for wind gusts |
| `theme.background_color` | string | Auto | Card background color |
| `theme.text_color` | string | Auto | Card title text color |

### Time Range Configuration

The `time_range` option provides advanced time control capabilities:

```yaml
time_range:
  start: "-24h"              # ISO datetime or relative (-24h, -2d)
  end: "now"                 # ISO datetime or "now"
  interval: "auto"           # "auto" for adaptive or fixed ("15min", "1hr")
  sampling: "windowed_representative"  # Sampling method
  window_size: "10min"       # Time window for representative sampling
  min_interval: "5min"       # Minimum data interval
  max_interval: "4h"         # Maximum data interval
  min_points: 3              # Minimum points in sampling window
  screen_multiplier:         # Max data points by screen size
    mobile: 8                # < 400px width
    tablet: 8                # 400-800px width
    desktop: 8               # > 800px width
```

#### Time Range Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `start` | string | "-24h" | Start time: ISO datetime or relative ("-24h", "-2d") |
| `end` | string | "now" | End time: ISO datetime or "now" |
| `interval` | string | "auto" | Data interval: "auto" or fixed ("15min", "1hr", "30min") |
| `sampling` | string | "windowed_representative" | Sampling method: "windowed_representative" or "single_point" |
| `window_size` | string | "10min" | Time window around each sample point |
| `min_interval` | string | "5min" | Minimum interval to prevent over-sampling |
| `max_interval` | string | "4h" | Maximum interval to ensure detail |
| `min_points` | number | 3 | Minimum points required in sampling window |
| `screen_multiplier.mobile` | number | 8 | Max data points for mobile screens (< 400px) |
| `screen_multiplier.tablet` | number | 8 | Max data points for tablet screens (400-800px) |
| `screen_multiplier.desktop` | number | 8 | Max data points for desktop screens (> 800px) |

### Interactive Controls

Enable interactive controls for real-time data exploration:

```yaml
type: custom:wind-barb-card
name: "Interactive Wind Meteogram"
wind_direction_entity: sensor.gw2000b_wind_direction
wind_speed_entity: sensor.gw2000b_wind_speed
show_time_presets: true      # Show 6h/12h/24h/48h buttons
show_window_control: true    # Show smoothing slider
time_range:
  start: "-24h"
  end: "now"
  sampling: "windowed_representative"
```

#### Custom Time Presets

```yaml
time_presets:
  - label: "1h"
    start: "-1h"
    end: "now"
    interval: "10min"
    window_size: "2min"
  - label: "Yesterday"
    start: "-48h"
    end: "-24h"
    interval: "3h"
    window_size: "30min"
```

#### Preset Options

| Option | Type | Description |
|--------|------|-------------|
| `label` | string | Button text |
| `start` | string | Start time (relative or ISO) |
| `end` | string | End time (relative, ISO, or "now") |
| `interval` | string | Data point spacing |
| `window_size` | string | Smoothing window size |

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

## NWS Forecast Integration

To enable forecast data, create a REST sensor for NWS gridded forecast data:

```yaml
rest:
  - resource: "https://api.weather.gov/gridpoints/PHI/51,114"  # Replace with your grid URL
    scan_interval: 900  # 15 minutes
    sensor:
      - name: "NWS Gridded Forecast"
        unique_id: nws_gridded_forecast
        value_template: "{{ value_json.properties.updateTime }}"
        json_attributes:
          - windSpeed
          - windDirection
          - temperature
        device_class: timestamp
```

**Finding Your Grid URL:**
1. Go to https://api.weather.gov/points/{latitude},{longitude}
2. Look for the "forecastGridData" property in the response
3. Copy that URL and use it as your resource URL

**Features:**
- **Dashed forecast lines** distinguish forecast from historical data
- **Present moment indicator** (red vertical line) separates past from future
- **Automatic time extension** includes forecast period in chart timeline
- **Interactive toggle** to show/hide forecast for comparison

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
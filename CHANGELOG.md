# Changelog

## [0.1.0] - 2025-01-XX

### Breaking Changes
- **Removed legacy `forecast_entity` support**: The card now exclusively uses time series forecast entities from the [NWS Grid Data integration](https://github.com/dgm/nws_griddata)
- Reason: NWS grid coordinates change over time, breaking manual REST sensor configurations

### Added
- Support for time series forecast entities via `forecast_direction_entity` and `forecast_speed_entity`
- Integration with NWS Grid Data integration (https://github.com/dgm/nws_griddata)
- Automatic handling of variable-duration forecast periods (PT1H, PT3H, PT12H, etc.)
- Direct reading of forecast data from entity attributes

### Changed
- Forecast data now read from entity `values` attribute instead of history API
- Simplified forecast configuration using separate direction and speed entities

### Migration Guide

**Before:**
```yaml
forecast_entity: sensor.nws_gridded_forecast
```

**After:**
```yaml
forecast_direction_entity: sensor.nws_wind_direction_id
forecast_speed_entity: sensor.nws_wind_speed_id
```

Requires installation of: https://github.com/dgm/nws_griddata

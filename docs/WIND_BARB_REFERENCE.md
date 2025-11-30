# Wind Barb Reference - National Weather Service Standards

## Wind Speed & Direction

Wind speed is indicated by a combination of long/short barbs and pennants, rounded to the nearest 5 knots. Calm wind is indicated by a large circle drawn around the skycover symbol.

### Barb Components
- **Long barb**: 10 knots each
- **Short barb**: 5 knots each  
- **Pennant**: 50 knots each (replaces barbs at 50+ knots)
- **Calm**: Large circle (0-2 knots)

For wind speeds higher than 50 knots, long and short barbs are used again in combination with the pennant(s).

## Wind Speed Examples

| Observed Speed | Rounded Speed | Barb Representation |
|----------------|---------------|-------------------|
| 0-2 kts (0-2 mph) | 0 kts | Circle (calm) |
| 3-7 kts (3-8 mph) | 5 kts | One short barb |
| 8-12 kts (9-14 mph) | 10 kts | One long barb |
| 13-17 kts (15-20 mph) | 15 kts | One long + one short barb |
| 18-22 kts (21-25 mph) | 20 kts | Two long barbs |
| 23-27 kts (26-31 mph) | 25 kts | Two long + one short barb |
| 28-32 kts (32-37 mph) | 30 kts | Three long barbs |
| 33-37 kts (38-43 mph) | 35 kts | Three long + one short barb |
| 48-52 kts (55-60 mph) | 50 kts | One pennant |
| 53-57 kts (61-66 mph) | 55 kts | One pennant + one short barb |
| 58-62 kts (67-71 mph) | 60 kts | One pennant + one long barb |
| 63-67 kts (73-77 mph) | 65 kts | One pennant + one long + one short barb |
| 98-102 kts (113-117 mph) | 100 kts | Two pennants |
| 102-107 kts (119-123 mph) | 105 kts | Two pennants + one short barb |

## Wind Direction

The wind direction is indicated by the long shaft, which points to the direction **FROM** which the wind is blowing. The direction is based upon a 36-point compass (10-degree increments).

### Direction Examples
- **Wind FROM 340° (NNW)**: Shaft points toward 340°, wind blowing toward 160° (SSE)
- **Wind FROM 040° (NE)**: Shaft points toward 040°, wind blowing toward 220° (SW)  
- **Wind FROM 190° (S)**: Shaft points toward 190°, wind blowing toward 010° (N)

## Implementation Notes

### Meteorological Convention
- Wind barbs point **INTO** the wind (toward the source direction)
- This is opposite to wind arrows which point **WITH** the wind (toward destination)
- The shaft indicates where the wind is coming **FROM**, not where it's going **TO**

### Rounding Rules
- Wind speeds are rounded to the nearest 5 knots for barb representation
- Directions are typically rounded to nearest 10° for standard plotting
- Calm conditions (0-2 knots) are represented by a circle, not barbs

### Visual Standards
- Barbs are drawn perpendicular to the shaft
- Pennants are triangular flags attached to the shaft
- All barbs/pennants are drawn on the same side of the shaft
- Standard meteorological color is black, but can be customized

## References
- National Weather Service - Station Weather Plots
- World Meteorological Organization (WMO) standards
- Aviation weather plotting conventions
# PF2E Property Runes

A FoundryVTT module that automates property rune effects for Pathfinder 2E weapons and armor, starting with the **Dread Rune** on armor.

## Features

### Dread Rune Automation
- **Automatic Detection**: Automatically detects when a creature with Dread Rune armor is present in the scene
- **Range Checking**: Monitors frightened enemies within 30 feet of Dread Rune armor
- **End-of-Turn Triggers**: Automatically triggers the Dread Rune effect when frightened enemies end their turn
- **Will Save Automation**: Forces DC 20 Will saves for affected creatures
- **Effect Application**: Prevents frightened condition from decreasing below 1 on failed saves
- **Visual Feedback**: Beautiful chat messages and UI indicators for all effects

## Installation

### Manual Installation
1. Download the module files
2. Place the `pf2e-property-runes` folder in your FoundryVTT `Data/modules/` directory
3. Restart FoundryVTT
4. Enable the module in the Setup menu

### From GitHub
1. Clone this repository
2. Copy the contents to your FoundryVTT `Data/modules/pf2e-property-runes/` directory
3. Restart FoundryVTT
4. Enable the module in the Setup menu

## Requirements

- **FoundryVTT**: Version 11 or higher
- **Game System**: Pathfinder 2E (PF2E)
- **Dependencies**: None

## How It Works

### Dread Rune Effect
The Dread Rune creates eerie symbols on armor that inspire terror in foes. When a frightened enemy within 30 feet ends their turn:

1. **Detection**: The module automatically detects if the enemy is within range of Dread Rune armor
2. **Trigger**: At the end of their turn, the Dread Rune effect is automatically triggered
3. **Will Save**: The enemy must attempt a DC 20 Will save
4. **Effect Application**: On a failure, their frightened condition cannot decrease below 1 that turn

### Technical Implementation
- **Hooks Integration**: Uses FoundryVTT's hook system to monitor turn changes and combat updates
- **Distance Calculation**: Calculates precise distances between tokens using grid-based measurements
- **Effect Management**: Automatically creates and applies temporary effects to prevent frightened decreases
- **Chat Integration**: Sends formatted chat messages for all Dread Rune interactions

## Usage

### For Players
1. **Equip Dread Rune Armor**: Simply equip armor with the Dread Rune property
2. **Automatic Activation**: The module automatically handles all Dread Rune effects
3. **Visual Feedback**: Watch for chat messages and UI indicators showing when effects trigger

### For Game Masters
1. **Enable the Module**: Activate the module in your world
2. **Monitor Effects**: The module will automatically handle all Dread Rune interactions
3. **Review Results**: Check chat logs for detailed information about all saves and effects

### Configuration
The module includes several configurable options:
- **Enable/Disable**: Toggle Dread Rune automation on/off
- **Save DC**: Adjust the Will save difficulty (default: 20)
- **Range**: Modify the effect range in feet (default: 30)
- **Chat Messages**: Control whether chat messages are displayed
- **Auto-roll Saves**: Choose whether saves are rolled automatically

## File Structure

```
pf2e-property-runes/
├── module.json              # Module manifest
├── scripts/
│   └── dread-rune.js        # Main automation logic
├── styles/
│   └── property-runes.css   # Styling for UI elements
├── lang/
│   └── en.json             # English localization
├── README.md               # This file
└── LICENSE                 # License information
```

## Technical Details

### Hooks Used
- `pf2e.endTurn`: Triggers when a turn ends in combat
- `updateCombat`: Monitors combat state changes
- `updateActor`: Tracks actor equipment changes
- `ready`: Initializes the module

### Distance Calculation
The module calculates distances using:
- Grid-based positioning from FoundryVTT
- Pythagorean theorem for accurate measurements
- Configurable grid size support
- Automatic conversion to feet

### Effect Management
- **Automatic Creation**: Creates temporary effects as needed
- **Duration Tracking**: Manages effect durations automatically
- **Cleanup**: Removes expired effects to prevent clutter

## Troubleshooting

### Common Issues

**Module Not Loading**
- Ensure FoundryVTT version 11+ is installed
- Verify PF2E system is active
- Check browser console for error messages

**Effects Not Triggering**
- Confirm armor has the Dread Rune property
- Check that enemies are within 30 feet
- Verify enemies have the frightened condition

**Save Rolls Not Working**
- Ensure the actor has a Will save modifier
- Check that the PF2E system is properly configured
- Verify module permissions

### Debug Information
Enable debug mode in the module settings to see detailed logging information in the browser console.

## Future Development

This module is designed to be expandable. Future versions may include:

- **Additional Property Runes**: Support for other weapon and armor runes
- **Advanced Automation**: More sophisticated effect handling
- **Configuration UI**: In-game settings panel
- **Effect Templates**: Pre-built effect templates for common runes
- **Integration**: Better integration with other PF2E modules

## Contributing

Contributions are welcome! Please feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This module is released under the same license as the main repository.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the FoundryVTT module development documentation
- Open an issue on the GitHub repository

## Changelog

### Version 1.0.0
- Initial release
- Dread Rune automation for armor
- Automatic Will save handling
- Effect prevention for frightened condition
- Beautiful UI styling and chat integration

---

**Note**: This module is designed for Pathfinder 2E and may not work with other game systems. Always test in a development environment before using in production.

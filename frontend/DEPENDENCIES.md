# Required Dependencies for JANMITRA Complaint Flow

To use the multi-step complaint registration flow, you need to install the following Expo packages:

## Required Packages

```bash
# Install required Expo packages
npx expo install expo-image-picker
npx expo install expo-av
npx expo install expo-location
npx expo install @react-native-picker/picker
```

## Package Descriptions

- **expo-image-picker**: For capturing photos/videos and selecting from gallery
- **expo-av**: For audio recording and playback functionality
- **expo-location**: For getting current location and reverse geocoding
- **@react-native-picker/picker**: For state/city dropdown selection

## Installation Command

Run this single command to install all required dependencies:

```bash
npx expo install expo-image-picker expo-av expo-location @react-native-picker/picker
```

## Note

These packages are essential for the complaint flow to work properly. The screens will show import errors until these packages are installed.

# PepTalk Buddy - Mobile App Design Document

## Overview
PepTalk Buddy is a motivational mobile app that sends personalized pep talks and quotes to users through push notifications. The app integrates with user calendars to provide context-aware encouragement before important events.

## Design Philosophy
- **Zen & Calming**: Use the Zen Color Palette to create a peaceful, encouraging atmosphere
- **Mobile-First**: Designed for portrait orientation (9:16) and one-handed usage
- **iOS-Native Feel**: Follow Apple Human Interface Guidelines for familiar, intuitive interactions
- **Minimal & Focused**: Clean interface that doesn't overwhelm, focusing on the motivational content

## Color Scheme (Zen Palette)
- **Primary**: Lake (#6B9FB1) - Calming blue for main interactive elements
- **Secondary**: Zen Garden (#5CB85C) - Green for success states and positive actions
- **Background**: White Dove (#F5F1ED) - Warm off-white for main background
- **Surface**: Mist (#D1D5D8) - Light gray for cards and elevated surfaces
- **Accent**: Sunset Sky (#D4A5A0) - Warm pink for highlights and special elements
- **Text Primary**: Basalt Stones (#1A1A1A) - Dark text for readability
- **Text Secondary**: Natural Stone (#9B8B88) - Muted text for secondary information
- **Border**: River Stone (#B8B8B8) - Subtle borders and dividers

## Screen List

### 1. Home Screen (Tab: Home)
**Purpose**: Display the current/latest pep talk quote with aesthetic presentation

**Content**:
- Large, beautifully formatted quote text
- Quote author/source
- Motivational illustration/background
- Quick action button to refresh quote
- Visual indicator of next notification time

**Functionality**:
- Display latest received quote
- Manual refresh to get new quote
- Smooth animations when quote changes
- Navigate to full-screen quote view on tap

### 2. Settings Screen (Tab: Settings)
**Purpose**: Configure notification preferences and calendar integrations

**Content**:
- **Notification Frequency Section**:
  - Toggle dropdown: Daily (12pm) / Twice Daily (12pm & 6pm) / Custom Time
  - Time picker (appears when "Custom Time" selected)
  - Maximum 3 notifications per day limit indicator
  
- **Calendar Integration Section**:
  - Toggle: "Send notifications before calendar events"
  - Google Calendar integration button (OAuth)
  - Apple Calendar integration button (OAuth)
  - Connection status indicators
  
- **Notification Settings**:
  - Enable/disable notifications toggle
  - Sound preferences
  - Preview notification button

**Functionality**:
- Save all settings to AsyncStorage
- Handle OAuth flows for calendar providers
- Validate time selections
- Schedule notifications based on preferences

### 3. Full-Screen Quote View (Modal)
**Purpose**: Display quote in an immersive, aesthetic format when notification is tapped

**Content**:
- Full-screen gradient background (Zen colors)
- Large, elegant typography for quote
- Author attribution
- Subtle decorative elements
- Close button

**Functionality**:
- Opened when user taps notification
- Swipe down to dismiss
- Share quote functionality
- Save favorite quotes

## Key User Flows

### Flow 1: First-Time Setup
1. User opens app for first time
2. Welcome screen explains app purpose
3. User navigates to Settings
4. User selects notification frequency (default: once daily at 12pm)
5. User optionally connects calendar
6. User returns to Home to see first quote

### Flow 2: Receiving Regular Notification
1. Scheduled time arrives (e.g., 12pm)
2. App fetches quote from API Ninjas
3. Push notification sent with quote text
4. User taps notification
5. App opens to Full-Screen Quote View
6. User reads quote, then closes or shares

### Flow 3: Calendar-Based Notification
1. App checks user's calendar for today's events
2. Detects keyword (e.g., "exam", "meeting", "interview")
3. One hour before event, app calls OpenAI API
4. Generates custom pep talk: "1 hour until your exam. You've got this!"
5. Sends notification with custom message
6. User taps to see full-screen view

### Flow 4: Manual Quote Refresh
1. User opens app to Home screen
2. User taps refresh button
3. App fetches new quote from API
4. Quote animates into view
5. User can tap to see full-screen version

## Technical Architecture

### Data Storage (AsyncStorage)
```typescript
{
  settings: {
    notificationFrequency: 'daily' | 'twice_daily' | 'custom',
    customTimes: string[], // e.g., ['12:00', '18:00']
    calendarIntegrationEnabled: boolean,
    googleCalendarConnected: boolean,
    appleCalendarConnected: boolean,
  },
  quotes: {
    current: { text: string, author: string, timestamp: number },
    history: Quote[],
  }
}
```

### Notification Scheduling
- Use `expo-notifications` for local notifications
- Schedule notifications based on user preferences
- Background task to check calendar and schedule custom notifications

### API Integration
1. **API Ninjas Quotes**: GET https://api.api-ninjas.com/v2/randomquotes
2. **Google Calendar**: OAuth + Calendar API for event reading
3. **OpenAI**: Generate custom pep talks based on calendar context

### Key Components
- `QuoteCard`: Reusable component for displaying quotes
- `SettingsToggle`: Custom toggle with dropdown options
- `TimePickerInput`: Time selection for custom notifications
- `CalendarIntegrationButton`: OAuth flow handler
- `FullScreenQuote`: Modal view for immersive quote display

## Design Patterns

### Typography
- **Quote Text**: Large (24-32pt), serif font, high contrast
- **Author**: Medium (16pt), sans-serif, muted color
- **UI Labels**: Small (14pt), sans-serif, standard weight
- **Buttons**: Medium (16pt), sans-serif, semibold

### Spacing
- Screen padding: 16-24px
- Component gaps: 12-16px
- Section spacing: 24-32px
- Comfortable tap targets: 44x44pt minimum

### Interactions
- Smooth transitions between screens
- Haptic feedback on important actions
- Loading states for API calls
- Error handling with friendly messages

## Platform Considerations
- **iOS**: Use SF Symbols for icons, native feel
- **Android**: Material Icons, respect system navigation
- **Notifications**: Request permissions on first launch
- **Background Tasks**: Handle calendar checking efficiently
- **Offline**: Cache quotes for offline viewing

## Success Metrics
- User receives notifications at scheduled times
- Calendar integration successfully detects key events
- Quotes display beautifully and are readable
- Settings persist across app sessions
- Smooth, bug-free user experience

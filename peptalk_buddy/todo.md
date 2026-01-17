# PepTalk Buddy - TODO

## Phase 1: Setup & Branding
- [x] Configure Zen Color Palette theme in theme.config.js
- [x] Generate custom app logo
- [x] Update app branding in app.config.ts

## Phase 2: Settings Screen
- [x] Create Settings tab in navigation
- [x] Implement notification frequency toggle dropdown (daily/twice daily/custom)
- [x] Add time picker for custom notification times
- [x] Create calendar integration toggle
- [x] Add Google Calendar OAuth button
- [x] Add Apple Calendar OAuth button
- [x] Implement settings persistence with AsyncStorage

## Phase 3: Home Screen & Quotes
- [x] Design Home screen layout with quote display
- [x] Integrate API Ninjas quotes API
- [x] Implement quote fetching functionality
- [x] Add refresh button for manual quote updates
- [x] Display next notification time indicator
- [x] Create quote history storage

## Phase 4: Notifications
- [x] Set up expo-notifications
- [x] Request notification permissions
- [x] Implement notification scheduling based on user preferences
- [x] Create notification handler for app opening
- [ ] Test notification delivery

## Phase 5: Full-Screen Quote View
- [x] Create full-screen quote modal component
- [x] Design aesthetic gradient background with Zen colors
- [x] Implement elegant typography for quote display
- [x] Add swipe-to-dismiss gesture
- [x] Add share functionality

## Phase 6: Calendar Integration (Advanced)
- [ ] Implement Google Calendar OAuth flow
- [ ] Fetch calendar events for current day
- [ ] Parse event titles for keywords (exam, meeting, interview, etc.)
- [ ] Integrate OpenAI API for custom pep talk generation
- [ ] Schedule notifications 1 hour before key events

## Phase 7: Testing & Polish
- [ ] Test all notification frequencies
- [ ] Verify settings persistence
- [ ] Test quote API integration
- [ ] Ensure responsive design on different screen sizes
- [ ] Add error handling for API failures
- [ ] Test offline functionality

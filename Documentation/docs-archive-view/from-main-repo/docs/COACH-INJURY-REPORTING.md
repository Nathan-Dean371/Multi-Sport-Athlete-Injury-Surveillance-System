# Coach Injury Reporting Feature

**Status:** ✅ Complete  
**Last Updated:** February 15, 2026  
**Author:** Development Team  

---

## Overview
The injury reporting system has been enhanced to provide coaches with a streamlined workflow for reporting injuries, including both quick pitch-side reports and detailed medical reports.

## New Features

### 1. **Report Type Selection**
When a coach clicks "Report Injury", they are now presented with two options:

- **Quick Report** (⚡): Fast pitch-side reporting with essential information only
- **Detailed Report** (📋): Comprehensive medical report with full diagnostic information

### 2. **Team & Player Selection**
Coaches can now easily select:
1. **Team**: Choose from their assigned teams
2. **Player**: Search and select from the team roster

The player selection screen includes:
- Player search by name, jersey number, or position
- Visual indicators for player status (🟢 GREEN, 🟠 ORANGE, 🔴 RED)
- Injury count badges for players with active injuries
- Auto-selection if coach has only one team

### 3. **Quick Report (Pitch-Side)**
Ideal for immediate reporting during games or practice:

**Fields:**
- ✅ Injury Type
- ✅ Body Part
- ✅ Side (Left/Right/Bilateral/Central)
- ✅ Severity (Minor/Moderate/Severe/Critical)
- ✅ Injury Date
- ✅ Quick Notes (optional)

**Benefits:**
- Minimal fields for fast entry
- Can add detailed information later by editing the injury
- Perfect for immediate documentation

### 4. **Detailed Report (Medical)**
Comprehensive report for medical staff:

**All Quick Report Fields PLUS:**
- ✅ Mechanism of Injury
- ✅ Medical Diagnosis
- ✅ Treatment Plan
- ✅ Expected Return Date
- ✅ Additional Notes

## User Flow

### For Coaches:
```
Tap "Report Injury" FAB
    ↓
Select Report Type (Quick or Detailed)
    ↓
Select Team (if multiple teams)
    ↓
Select Player from roster
    ↓
Fill in injury details
    ↓
Submit
```

### For Players:
```
Tap "Report Injury" FAB
    ↓
Go directly to report form (pre-filled with their ID)
    ↓
Fill in injury details
    ↓
Submit
```

## New Screens

### 1. SelectReportTypeScreen
- **Location**: `mobile/src/screens/injuries/SelectReportTypeScreen.tsx`
- **Purpose**: Allow coaches to choose between Quick and Detailed reports
- **Features**: 
  - Visual cards with feature comparisons
  - Clear icons for each report type
  - List of included fields for each option

### 2. SelectPlayerScreen
- **Location**: `mobile/src/screens/injuries/SelectPlayerScreen.tsx`
- **Purpose**: Team and player selection
- **Features**:
  - Team selection with sport and player count
  - Auto-selection for single team
  - Player search functionality
  - Status indicators and injury counts
  - Jersey numbers displayed as avatars

### 3. QuickReportInjuryScreen
- **Location**: `mobile/src/screens/injuries/QuickReportInjuryScreen.tsx`
- **Purpose**: Simplified injury reporting for quick documentation
- **Features**:
  - Streamlined form with only essential fields
  - Pre-filled player information
  - Clear "Quick Report" badge
  - Info box explaining ability to edit later

### 4. Enhanced ReportInjuryScreen
- **Location**: `mobile/src/screens/injuries/ReportInjuryScreen.tsx`
- **Purpose**: Detailed injury reporting
- **Enhancements**:
  - Accepts player selection from previous screens
  - Shows player info card when player is pre-selected
  - Maintains backward compatibility for direct access

## Navigation Structure

```
InjuryStack:
  ├── InjuryList
  ├── InjuryDetail
  ├── SelectReportType (NEW)
  ├── SelectPlayer (NEW)
  ├── QuickReportInjury (NEW)
  ├── ReportInjury (Enhanced)
  ├── EditInjury
  └── PlayerDetail
```

## Backend Compatibility

No backend changes required! The system uses existing endpoints:
- `GET /teams/coach/my-teams` - Fetch coach's teams
- `GET /teams/:teamId/players` - Fetch team roster
- `POST /injuries` - Create injury report

Both quick and detailed reports use the same creation endpoint. Quick reports simply omit optional fields.

## Technical Details

### Updated Files:
1. `mobile/src/navigation/TabNavigator.tsx` - Added new screens to navigation
2. `mobile/src/screens/injuries/InjuryListScreen.tsx` - Updated FAB handler for coaches
3. `mobile/src/screens/injuries/ReportInjuryScreen.tsx` - Enhanced to accept route params
4. `mobile/src/screens/injuries/SelectReportTypeScreen.tsx` - NEW
5. `mobile/src/screens/injuries/SelectPlayerScreen.tsx` - NEW
6. `mobile/src/screens/injuries/QuickReportInjuryScreen.tsx` - NEW

### Key Dependencies:
- Existing `teamService` for team/roster data
- Existing `injuryService` for injury creation
- React Native Paper for consistent UI components
- React Hook Form for form management

## Benefits

### For Coaches:
- ⚡ **Faster reporting** during games/practice with Quick Report
- 🎯 **Easy player selection** with visual team roster
- 📊 **Better context** with player status and injury history visible
- 🔄 **Flexibility** to add details later

### For Medical Staff:
- 📋 **Comprehensive data** available via Detailed Report
- 🏥 **Proper documentation** with all medical fields
- 📅 **Treatment tracking** with return date estimates

### For System:
- ✅ **No breaking changes** - existing functionality preserved
- 🔒 **Role-based** - players still report their own injuries directly
- 📱 **Responsive** - works on all screen sizes
- ♿ **Accessible** - clear labels and visual hierarchy

## Future Enhancements

Potential improvements:
- [ ] Voice-to-text for quick notes
- [ ] Photo attachment for injuries
- [ ] Pre-filled common injury patterns
- [ ] Offline support for pitch-side reporting
- [ ] Bulk status updates after games
- [ ] Team injury summary/analytics

---

## Related Documentation
- [Report Builder Feature](REPORT-BUILDER.md)
- [Authentication Implementation](authentication-implementation.md)
- [Testing Strategy](TESTING-STRATEGY.md)
- [Mobile App Setup](setup/mobile-app-setup.md)

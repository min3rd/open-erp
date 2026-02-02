# Province Management - Drawing & Resizing Features

## Overview of Enhancements
This document describes the new interactive drawing capabilities and resizable layout implemented in response to user feedback.

## 1. Interactive Drawing Capability

### DrawMapComponent
A new interactive map component that allows users to draw and edit province boundaries directly on the map.

#### Features:
- **Draw Polygons**: Click points on the map to create custom polygon boundaries
- **Draw Rectangles**: Quickly create rectangular boundaries
- **Edit Geometries**: Click existing shapes to move vertices and reshape
- **Delete Shapes**: Remove drawn boundaries
- **Clear All**: Button to remove all drawings at once

#### Drawing Controls (Leaflet Draw):
```
Top-right toolbar on map:
┌────────────────┐
│ 🔷 Polygon     │  - Draw custom polygon
│ ▢ Rectangle    │  - Draw rectangle
│ ✏️ Edit         │  - Edit existing shapes
│ 🗑️ Delete       │  - Delete shapes
└────────────────┘
```

### GeoEditor with Tabs

The GeoEditor now provides two input methods through a tabbed interface:

#### Tab 1: Text Editor (Original)
- Paste GeoJSON text
- Validates JSON format
- Supports Geometry, Feature, or FeatureCollection
- Apply button to commit changes
- Clear button to remove

#### Tab 2: Draw on Map (NEW)
- Interactive map with drawing tools
- Visual feedback while drawing
- Auto-generates GeoJSON from drawings
- Synchronized with text editor
- Edit/delete drawn features

```
┌─────────────────────────────────────────┐
│ 📝 Text Editor | 🗺️ Draw on Map        │
├─────────────────────────────────────────┤
│                                         │
│  [Active tab content]                   │
│                                         │
│  - Text: Paste GeoJSON                  │
│  - Draw: Interactive map                │
│                                         │
└─────────────────────────────────────────┘
```

### Workflow Example:

**Option A - Draw on Map:**
1. Open province form (add/edit)
2. Click "Draw on Map" tab
3. Use polygon tool to draw boundary
4. Click points on map to create shape
5. Double-click to finish
6. Edit vertices if needed
7. Save - GeoJSON is automatically generated

**Option B - Paste GeoJSON:**
1. Open province form (add/edit)
2. Stay on "Text Editor" tab (default)
3. Paste GeoJSON from external source
4. Click "Apply" to validate
5. Save

**Option C - Hybrid:**
1. Start with drawing on map
2. Switch to Text Editor to fine-tune coordinates
3. Switch back to see visual result
4. Both tabs stay synchronized

## 2. Resizable Panels (PrimeSplitter)

### Before:
```
┌────────────────┬────────────────┐
│                │                │
│   List 50%     │    Map 50%     │  Fixed sizes
│                │                │
└────────────────┴────────────────┘
```

### After:
```
┌────────────────┃────────────────┐
│                ┃                │
│   List         ┃    Map         │  Draggable divider
│   (30-70%)     ┃   (30-70%)     │
└────────────────┻────────────────┘
                 ↕
             Drag to resize
```

### Usage:
1. Hover over the divider between list and map
2. Cursor changes to resize indicator (↔)
3. Click and drag left/right to adjust sizes
4. Minimum: 30% for each panel
5. Default: 50-50 split
6. Size preference persists during session

### Benefits:
- **Focus on List**: Resize map smaller when browsing provinces
- **Focus on Map**: Expand map for detailed boundary viewing
- **Flexible Workflow**: Adjust based on current task
- **User Preference**: Each user can set their preferred layout

## 3. View/Edit Functionality

### Fixed Issues:
- ✅ Drawer now opens properly for view/edit routes
- ✅ Form loads province data correctly
- ✅ Geometry displays in both editor and preview map
- ✅ Navigation between list and detail works seamlessly

### Routes:
```
/province/all/1/10          → List view
/province/all/1/10/new      → Create (drawer opens)
/province/all/1/10/:id      → View (drawer opens, redirects to /view)
/province/all/1/10/:id/view → View mode (read-only)
/province/all/1/10/:id/edit → Edit mode (editable)
```

### Context Menu Actions:
- **View**: Opens drawer in view mode (read-only)
- **Edit**: Opens drawer in edit mode (can modify)
- **Delete**: Shows confirmation dialog

## Technical Details

### New Files Created:
```
src/core/components/draw-map/
├── draw-map.component.ts      # Component logic with Leaflet Draw
├── draw-map.component.html    # Template with map container
└── draw-map.component.css     # Styles including Leaflet Draw CSS
```

### Modified Files:
```
src/core/components/geo-editor/
├── geo-editor.component.ts    # Added tabs and draw integration
└── geo-editor.component.html  # Tab-based UI

src/app/private/modules/management/province/list/
├── list.ts                    # Added SplitterModule import
└── list.html                  # Replaced flex layout with p-splitter

public/i18n/
├── en.json                    # Added drawing translations
└── vi.json                    # Added Vietnamese translations
```

### Dependencies Added:
```json
{
  "dependencies": {
    "leaflet-draw": "1.0.4"
  },
  "devDependencies": {
    "@types/leaflet-draw": "^1.0.x"
  }
}
```

### Translation Keys:
```typescript
// English
"provinceList.geoEditor.textTab": "Text Editor"
"provinceList.geoEditor.drawTab": "Draw on Map"
"provinceForm.drawMap.clear": "Clear Drawing"

// Vietnamese
"provinceList.geoEditor.textTab": "Soạn thảo văn bản"
"provinceList.geoEditor.drawTab": "Vẽ trên bản đồ"
"provinceForm.drawMap.clear": "Xóa vẽ"
```

## Drawing Tools Reference

### Leaflet Draw Controls:

**Draw Polygon:**
- Click map to place each vertex
- Double-click to complete shape
- Minimum 3 points required

**Draw Rectangle:**
- Click and drag to create rectangle
- Release to complete

**Edit Features:**
- Click edit button
- Click shape to enable vertex editing
- Drag vertices to reshape
- Click "Save" to apply changes

**Delete Features:**
- Click delete button
- Click shapes to mark for deletion
- Click "Delete" to confirm removal

**Clear All:**
- Red "Clear Drawing" button at bottom-left
- Removes all drawn features instantly
- No confirmation (can undo by drawing again)

## Keyboard Shortcuts

- **Esc**: Cancel current drawing operation
- **Enter**: Complete polygon drawing
- **Backspace/Delete**: Remove last vertex while drawing

## Browser Support

All modern browsers with:
- WebGL support (for smooth map rendering)
- Canvas API (for drawing operations)
- ES6+ JavaScript support

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- Drawing operations are client-side (no server calls until save)
- GeoJSON generation is optimized for complex polygons
- Map tiles cached for better performance
- Splitter resize is smooth (CSS transitions)

## Accessibility

- All drawing controls have ARIA labels
- Keyboard navigation supported
- Screen reader announcements for drawing actions
- Focus management in drawer
- High contrast mode compatible

## Future Enhancements (Potential)

- Import GeoJSON file and draw automatically
- Snap to existing boundaries
- Measure area while drawing
- Draw circles (convert to approximate polygon)
- Multi-layer support (overlapping provinces)
- Undo/redo drawing operations
- Copy/paste geometries between provinces

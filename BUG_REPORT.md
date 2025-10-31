# Bug Report - E2E Testing Findings

**Date:** 2025-10-31
**Test Suite:** Playwright E2E Tests
**Total Tests:** 33 (11 tests × 3 browsers)
**Passing:** 9/33 (27%)
**Failing:** 24/33 (73%)

---

## Critical Bugs Discovered

### 🔴 BUG #1: Entity Position Persistence Not Working (CRITICAL - Priority #1)

**Severity:** Critical
**Status:** Confirmed across all browsers (Chromium, Firefox, WebKit)
**Affected Tests:** `entity-position-persistence.spec.ts` - All 3 tests failing

#### Description

Entity positions are NOT persisting correctly across page reloads. After dragging an entity to a new position and reloading the page, the entity appears at a significantly different location than where it was placed.

#### Evidence

```
Initial position:        { x: 0,   y: 142 }
Position after drag:     { x: 200, y: 302 }
Position after reload:   { x: 180, y: 197 }  ❌

Expected difference: < 5 pixels
Actual difference:   20 pixels (X), 105 pixels (Y)
```

#### Steps to Reproduce

1. Create a new project
2. Add an entity to the canvas
3. Drag the entity to position (200, 302)
4. Reload the page
5. Observe entity is at position (180, 197) instead

#### Expected Behavior

Entity position should persist exactly (within 1-2px tolerance for rendering) across page reloads.

#### Actual Behavior

Entity position changes significantly after page reload, off by 20-105 pixels.

#### Impact

- **User Priority #1:** This was identified as the highest priority feature
- All entity layout work is lost on page reload
- Users cannot trust their canvas arrangements
- Affects 9 tests across all browsers (3 tests × 3 browsers)

#### Test Files

- `tests/e2e/entity-position-persistence.spec.ts:22` - "should persist entity position across page reload"
- `tests/e2e/entity-position-persistence.spec.ts:69` - "should persist positions for multiple entities"
- `tests/e2e/entity-position-persistence.spec.ts:143` - "should persist entity position with decimal precision"

#### Code Locations to Investigate

- `client/src/features/entities/hooks/useEntityActions.ts:handleUpdatePosition` - Position update logic
- `client/src/features/entities/components/GraphView.tsx` - Canvas drag handlers
- `client/src/lib/storage/LocalStorageService.ts:updateEntity` - Position persistence (✅ Unit tests show this works correctly)
- React Flow `onNodeDragStop` handler - May not be calling handleUpdatePosition correctly

#### Additional Notes

- LocalStorageService unit tests show position persistence works at the storage layer
- The bug is likely in the GraphView layer or the integration between GraphView and storage
- Position data may not be getting saved at all, or may be saved incorrectly, or loading logic may be wrong

---

### 🟡 BUG #2: Business Purpose Field Not Saving for DLO Entities

**Severity:** Medium
**Status:** Confirmed across all browsers
**Affected Tests:** `entity-data-persistence.spec.ts` - 1 test failing

#### Description

When creating a DLO entity with a business purpose, the business purpose field is not persisted to localStorage. After page reload, the field is empty.

#### Evidence

```javascript
// Test creates DLO entity with:
{
  name: 'Test Entity',
  type: 'dlo',
  businessPurpose: 'Storage test'
}

// After reload, localStorage shows:
{
  name: 'Test Entity',
  type: 'dlo',
  businessPurpose: ''  // ❌ EMPTY
}
```

#### Steps to Reproduce

1. Create a new project
2. Add a DLO entity with business purpose "Storage test"
3. Reload the page
4. Inspect localStorage or edit the entity
5. Observe business purpose field is empty

#### Expected Behavior

Business purpose field should persist for all entity types including DLO.

#### Actual Behavior

Business purpose field is empty after reload for DLO entity type.

#### Impact

- Data loss for DLO entities
- Users must re-enter business purpose on every reload
- Affects 3 tests across all browsers

#### Test Files

- `tests/e2e/entity-data-persistence.spec.ts:202` - "should persist localStorage data structure correctly"

#### Code Locations to Investigate

- `client/src/features/entities/components/EntityModal.tsx` - Form submission logic (lines 152-180)
- Check if business purpose is conditionally excluded for DLO entities
- `client/src/features/entities/components/EntityModal.tsx:449-463` - DLO-specific form fields
- Verify business purpose field is included in form for DLO type

#### Additional Notes

- Business purpose likely works for DMO entities (tests pass for those)
- May be a conditional rendering or form submission issue specific to DLO entity type
- LocalStorageService correctly handles the field (unit tests pass)

---

## Test Code Issues (Not Application Bugs)

### ⚠️ ISSUE #1: Data Stream Entity Type Selection Regex

**Severity:** Test Infrastructure
**Status:** Identified
**Impact:** 6 tests failing

#### Description

Test code uses regex `/data-stream/i` to select entity type, but the actual UI text is "Data Stream (Ingestion)". The regex doesn't match, causing tests to timeout.

#### Evidence

```javascript
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('option', { name: /data-stream/i })
```

Screenshot shows dropdown with option: "Data Stream (Ingestion)" ✅ visible

#### Fix Required

Update `tests/page-objects/EntityModalPage.ts` line 38 to map entity type values to UI display text:

```typescript
// Current (broken):
await this.page.getByRole('option', { name: new RegExp(data.type, 'i') }).click();

// Fix needed:
const typeDisplayMap = {
  'data-stream': 'Data Stream (Ingestion)',
  dlo: 'DLO (Data Lake Object)',
  dmo: 'DMO (Data Model Object)',
  'data-transform': 'Data Transform',
};
await this.page
  .getByRole('option', {
    name: new RegExp(typeDisplayMap[data.type], 'i'),
  })
  .click();
```

---

### ⚠️ ISSUE #2: Select Element Value Check

**Severity:** Test Infrastructure
**Status:** Identified
**Impact:** 3 tests failing

#### Description

Test code tries to use `.inputValue()` on select elements, which is not supported. Need to use `.textContent()` instead.

#### Evidence

```javascript
Error: locator.inputValue: Error: Node is not an <input>, <textarea> or <select> element
```

#### Fix Required

Update `tests/e2e/entity-data-persistence.spec.ts` line 54:

```typescript
// Current (broken):
const typeValue = await entityModal.typeSelect.inputValue();

// Fix needed:
const typeValue = await entityModal.typeSelect.textContent();
```

---

## Test Results Summary

### Passing Tests (9/33)

- ✅ All "create project and add first entity" tests (3/3 browsers) - DMO entities work
- ✅ All "handle empty project correctly" tests (3/3 browsers)
- ✅ Some entity data persistence tests (partial)

### Failing Tests (24/33)

#### Critical Application Bugs (18 failures)

- ❌ Entity position persistence (9 failures = 3 tests × 3 browsers)
- ❌ Business purpose field for DLO (3 failures = 1 test × 3 browsers)
- ❌ Data stream entity creation - **Test Issue** (6 failures = 2 tests × 3 browsers)

#### Test Code Issues (6 failures)

- ⚠️ Select value verification (3 failures = 1 test × 3 browsers)
- ⚠️ Data stream entity type regex (already counted above)

---

## Recommendations

### Immediate Action Required

1. **Fix Bug #1 (Position Persistence)** - CRITICAL
   - This is the user's #1 priority
   - Investigate React Flow `onNodeDragStop` handler
   - Verify `handleUpdatePosition` is being called
   - Check if position updates are actually reaching localStorage
   - Review position loading logic on page initialization

2. **Fix Bug #2 (Business Purpose for DLO)** - MEDIUM
   - Check EntityModal form submission for DLO entities
   - Verify business purpose field is included in save payload
   - Test manually to confirm the bug

3. **Fix Test Issues** - LOW
   - Update entity type selection regex (5 minutes)
   - Fix select value check (2 minutes)
   - Re-run test suite to verify fixes

### Investigation Path for Bug #1 (Position Persistence)

```
1. Add console.log to handleUpdatePosition to verify it's called
2. Check if mutateAsync completes successfully
3. Verify LocalStorageService.updateEntity receives correct position
4. Check if position is written to localStorage (manual inspection)
5. Verify position is read correctly on page load
6. Check React Flow node initialization logic
```

### Next Steps

After fixing these bugs:

- Re-run E2E test suite
- Expected: 33/33 tests passing (100%)
- Generate coverage report
- Document any remaining edge cases

---

## Files Modified During Testing

### Created

- ✅ `tests/page-objects/BasePage.ts`
- ✅ `tests/page-objects/NavbarPage.ts`
- ✅ `tests/page-objects/GraphViewPage.ts`
- ✅ `tests/page-objects/EntityModalPage.ts`
- ✅ `tests/e2e/entity-position-persistence.spec.ts`
- ✅ `tests/e2e/entity-data-persistence.spec.ts`
- ✅ `tests/e2e/project-creation.spec.ts`

### Modified

- ✅ `playwright.config.ts` - Fixed port (5173 → 5000)

### Needs Fix

- ⚠️ `tests/page-objects/EntityModalPage.ts` - Entity type regex
- ⚠️ `tests/e2e/entity-data-persistence.spec.ts` - Select value check

---

## Test Infrastructure Status

### ✅ Working Correctly

- Playwright configuration
- Page Object Model architecture
- Test isolation (localStorage clearing)
- Browser coverage (Chromium, Firefox, WebKit)
- Screenshot on failure
- Error context generation

### ✅ Selectors Fixed

- Port configuration (5000)
- "Create Your First Project" button
- React Flow canvas (`rf__wrapper` test ID)
- FAB button (`button.rounded-full.bg-primary-500`)
- Entity modal form fields (all using data-testid)
- Required field creation (adds "id" field automatically)

---

**Report Generated:** 2025-10-31
**E2E Test Suite Version:** 1.0
**Next Update:** After bugs are fixed and tests re-run

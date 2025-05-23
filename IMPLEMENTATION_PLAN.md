# Mirror Simulation Implementation Plan (Plain Config Objects, Prioritizing Parallel Mirrors)

## Phase 0: Project Setup & Basic Canvas

*   **Goal:** Initialize Next.js project, add p5.js, TypeScript, and `@flatten-js/core`, render basic canvas.
*   **Tasks:** (Assuming Next.js app creation and dependency installation were done prior)
    - [x] Create Next.js app (`npx create-next-app@latest --typescript`). *(Verified)*
    - [x] Install p5.js (`npm install p5`). *(Verified)*
    - [x] Install geometry library: `npm install @flatten-js/core`. *(Verified)*
    - [x] Define core types in `src/lib/types.ts`: Include `PointCoords = { x: number; y: number; }`. Define `SceneConfig`, basic `SceneElement`.
    - [x] Create `SimulationCanvas.tsx`.
    - [x] Integrate basic p5 sketch (`src/sketch/mainSketch.ts`) drawing background.
    - [x] Render `SimulationCanvas` on page (`src/pages/index.tsx`).
*   **Code Modules:** `pages/index.tsx`, `components/SimulationCanvas.tsx`, `sketch/mainSketch.ts`, `lib/types.ts`.
*   **Commit:** `feat: Setup Next.js, TypeScript, p5.js, @flatten-js/core and render basic canvas`

## Phase 1: Static Element Rendering

*   **Goal:** Define and render a static viewer and mirror from `SceneConfig` using `PointCoords`.
*   **Tasks:**
    - [x] Expand types in `types.ts` for `ViewerElement` (using `position: PointCoords`) and `MirrorElement` (using `start: PointCoords`, `end: PointCoords`).
    - [x] Update `SceneConfig` type.
    - [x] Create default `sceneConfig` with one viewer, one mirror using `{x, y}` objects.
    - [x] Modify p5 sketch to loop through elements: Draw viewers and mirrors using `.x`, `.y` directly from the `PointCoords` objects in the config.
*   **Code Modules:** `lib/types.ts`, `sketch/mainSketch.ts`, `pages/index.tsx`.
*   **Commit:** `feat: Render static viewer and mirror elements from SceneConfig using PointCoords`

## Phase 2: Virtual Image Calculation & Display (Single Mirror)

*   **Goal:** Calculate and display the virtual image, translating coordinates for library use.
*   **Tasks:**
    - [x] Implement `calculateVirtualImagePosition(elementPosCoords: PointCoords, mirror: MirrorElement): PointCoords` in `lib/simulation.ts`:
        - [x] **Translate Input:** Convert `elementPosCoords`, `mirror.start`, `mirror.end` into `Flatten.Point` instances. Create `Flatten.Line` for the mirror.
        - [x] **Leverage `@flatten-js/core`:** Use verified library functions to calculate the reflection (`Flatten.Point`).
        - [x] **Translate Output:** Convert the resulting `Flatten.Point` back into `PointCoords` (`{ x, y }`).
    - [x] In p5 sketch: Calculate virtual viewer position (`PointCoords`); draw it (dotted) using its `.x`, `.y`.
*   **Code Modules:** `lib/simulation.ts`, `lib/types.ts`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Calculate and draw virtual viewer image using @flatten-js/core (with coord translation)`

## Phase 3: Viewer Interaction (Drag & Drop)

*   **Goal:** Allow dragging viewer with boundary checks and drag-end state updates, using `PointCoords`.
*   **Tasks:**
    - [x] Use React state (`useState`) for `sceneConfig` (containing `PointCoords`). Pass state and setter down.
    - [x] **Implement Basic Drag Logic (p5 sketch):**
        - [x] Internal State: `isDraggingViewer`, `dragOffset`, `viewerWasDragged`.
        - [x] `mousePressed`: Identify viewer, set internal state.
        - [x] `mouseDragged`: Calculate `nextPosCoords`, apply canvas constraints, update internal `currentSceneConfig.viewer.position`.
        - [x] `mouseReleased`: If `viewerWasDragged`, create deep copy of `currentSceneConfig`, call `onSceneUpdate` callback (passed via props). Reset internal drag state.
    - [ ] **TODO:** Implement correct mirror boundary check in `mouseDragged` using `@flatten-js/core`.
*   **Code Modules:** `pages/index.tsx`, `components/SimulationCanvas.tsx`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Enable basic dragging for viewer with state update on drag end`

## Phase 4: Adding the Object

*   **Goal:** Add a physical object, calculate its virtual representation (including orientation), and draw both.
*   **Tasks:**
    - [x] Define `ObjectElement` type (using `position: PointCoords`, add `shape: 'triangle'`, `radius`). Add object to `sceneConfig`.
    - [x] Define `VirtualObjectElement` type to store reflected vertices.
    - [x] Implement `calculateVirtualObject(object: ObjectElement, mirror: MirrorElement): VirtualObjectElement | null` in `simulation.ts`.
        - Handles different shapes (point, triangle).
        - For triangles, calculates original vertices based on position/radius.
        - Uses `calculateVirtualImagePosition` to reflect each vertex.
        - Returns structure containing reflected vertices.
    - [x] Update `drawObject` in sketch to draw the specified shape (triangle).
    - [x] In p5 sketch: Call `calculateVirtualObject`. Update `drawVirtualObject` to take `VirtualObjectElement` and draw using its vertices.
*   **Code Modules:** `lib/types.ts`, `lib/simulation.ts`, `sketch/mainSketch.ts`, `pages/index.tsx`.
*   **Commit:** `feat: Add object, calculate & draw virtual object with correct orientation`

## Phase 5: Ray Path Calculation (Single Reflection)
*   **Goal:** Calculate ray path points using `@flatten-js/core`, managing coordinate translation.
*   **Tasks:**
    - [x] Implement `calculateSingleReflectionPath(objPosCoords: PointCoords, viewPosCoords: PointCoords, mirror: MirrorElement): RayPath | null` in `lib/simulation.ts`.
        - [x] **Translate Inputs:** Convert input `PointCoords` (viewer, mirror start/end) and calculated virtual object `PointCoords` to `Flatten.Point`/`Segment`.
        - [x] Calculate virtual object position (`PointCoords`) using `calculateVirtualImagePosition`.
        - [x] Define viewer-virtual segment (`Flatten.Segment`).
        - [x] Define mirror segment (`Flatten.Segment`).
        - [x] **Leverage `@flatten-js/core`:** Find intersection (`Flatten.Point`) between viewer-virtual segment and mirror segment using `Segment.intersect()`.
        - [x] **Leverage `@flatten-js/core`:** Check if intersection point is on mirror segment (handled implicitly by `Segment.intersect()`).
        - [x] If valid (one intersection), construct path data. **Translate intersection point back to `PointCoords`**.
        - [x] Return `RayPath` (containing `PointCoords`) or `null`.
*   **Code Modules:** `lib/simulation.ts`, `lib/types.ts`.
*   **Commit:** `feat: Calculate single-reflection ray path points using @flatten-js/core (with coord translation)`

## Phase 6: Ray Path Drawing

*   **Goal:** Visualize the calculated ray path in the p5 sketch.
*   **Tasks:**
    - [x] In p5 sketch, use result from Phase 5 (`calculateSingleReflectionPath`).
    - [x] If valid path exists:
        - [x] Create `drawArrow` helper function.
        - [x] Create `drawRayPath` helper function.
        - [x] Draw solid lines with arrowheads using the `.x`, `.y` properties of the `PointCoords` within the `RayPath` structure.
*   **Code Modules:** `sketch/mainSketch.ts`.
*   **Commit:** `feat: Draw solid ray path with arrows`

## Phase 7: Object Dragging & Style Configuration

*   **Goal:** Enable dragging for the object element (reusing viewer logic) and centralize styling configuration.
*   **Tasks:**
    - [x] Refactored drag state variables (`draggedElementId`, `elementWasDragged`) in `sketch/mainSketch.ts` to be generic.
    - [x] Updated `mousePressed`, `mouseDragged`, `mouseReleased` in `sketch/mainSketch.ts` to detect and move either the viewer or the object based on their ID.
    - [x] Applied canvas boundary checks during drag in `mouseDragged`.
    - [x] Ensured `onSceneUpdate` callback is triggered correctly on drag end for the moved element.
    - [x] Defined `StyleParams` interface in `lib/types.ts` for visual parameters.
    - [x] Added `styleParams` object with default values to the initial `SceneConfig` in `pages/index.tsx`.
    - [x] Added `getStyle` helper function in `sketch/mainSketch.ts`.
    - [x] Updated all drawing functions (`drawViewer`, `drawObject`, `drawMirror`, `drawVirtualViewer`, `drawVirtualObject`, `drawRayPath`, `drawArrow`) in `sketch/mainSketch.ts` to accept the `SceneConfig` and use `styleParams` values with appropriate fallbacks.
*   **Code Modules:** `lib/types.ts`, `pages/index.tsx`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Enable object dragging and centralize style configuration`

## Phase 8: UI Controls & Visualization Options

*   **Goal:** Add basic React controls (toggles) for visualization clarity before adding multi-mirror complexity.
*   **Tasks:**
    - [x] Define `ControlParams` interface in `lib/types.ts` (e.g., `showRayPaths`).
    - [x] Add optional `controls` field of type `ControlParams` to `SceneConfig` in `lib/types.ts`.
    - [x] Add default `controls` object (e.g., `{ showRayPaths: true }`) to the initial `SceneConfig` in `pages/index.tsx`.
    - [x] Create `ControlPanel.tsx` component with a checkbox bound to state managing the `showRayPaths` flag. It should accept `controls` and `onControlChange` props.
    - [x] Update main page (`pages/index.tsx`) state management:
        - [x] Add `handleControlChange` callback to update the `controls` part of the `sceneConfig` state.
        - [x] Pass `sceneConfig.controls` and `handleControlChange` down to `ControlPanel`.
    - [x] Pass the full `sceneConfig` (including `controls`) down to `SimulationCanvas` and into the sketch via `updateWithProps`.
    - [x] Modify p5 sketch drawing logic (`p.draw`, `drawRayPath`) to conditionally draw based on the `showRayPaths` flag read from `currentSceneConfig.controls`. (Virtual images remain unaffected by this toggle).
*   **Code Modules:** `lib/types.ts`, `components/ControlPanel.tsx`, `pages/index.tsx`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Add UI toggle for showing/hiding ray paths using separate controls state`

## Phase 9: Parallel Mirrors (Multiple Reflections) - **PRIORITY**

*   **Goal:** Implement multiple reflections between two parallel mirrors, managing coordinate translations and ray path generation.
*   **Tasks:**
    - [ ] Update `simulationParams`, add second mirror (`PointCoords`) to `sceneConfig`.
    - [ ] Refactor `simulation.ts`: `getAllVirtualImages(...)`, `tracePathToVirtualImage(...)`.
        - [ ] **Internal Translation:** These functions will need to consistently translate `PointCoords` inputs to `Flatten.Point`/`Segment`/`Line` for internal library calculations (reflections, intersections, checks) and potentially translate results back if needed for the returned data structure (e.g., list of `VirtualImage` containing `position: PointCoords`).
        - [ ] Store `reflectionHistory`.
    - [ ] Update p5 sketch to use new functions and draw results using `.x`, `.y` from the returned `PointCoords`.
*   **Code Modules:** `lib/types.ts`, `lib/simulation.ts`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Implement multiple reflections for parallel mirrors (with coord translation)`

## Phase 10: Obstructions (Optional Extension)

*   **Goal:** Add obstructions, **if time permits**.
*   **Tasks:**
    - [ ] Define `ObstructionElement` type (e.g., using `vertices: PointCoords[]`). Add to `sceneConfig`.
    - [ ] Modify path calculation functions in `simulation.ts`:
        - [ ] **Translate Geometry:** Convert path segments and obstruction vertices (`PointCoords`) to `Flatten.Segment` / `Flatten.Polygon`.
        - [ ] **Leverage `@flatten-js/core`:** Use verified intersection checks between segments and polygons.
    - [ ] Update p5 sketch to draw obstructions (using `.x`, `.y` from vertices) and filter blocked paths.
*   **Code Modules:** `lib/types.ts`, `lib/simulation.ts`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Implement obstructions blocking ray paths (with coord translation)`

## Phase X: Optional Enhancements
*   *(Deferred)*
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
    - [ ] Implement `calculateVirtualImagePosition(elementPosCoords: PointCoords, mirror: MirrorElement): PointCoords` in `lib/simulation.ts`:
        - [ ] **Translate Input:** Convert `elementPosCoords`, `mirror.start`, `mirror.end` into `Flatten.Point` instances. Create `Flatten.Line` for the mirror.
        - [ ] **Leverage `@flatten-js/core`:** Use verified library functions to calculate the reflection (`Flatten.Point`).
        - [ ] **Translate Output:** Convert the resulting `Flatten.Point` back into `PointCoords` (`{ x, y }`).
    - [ ] In p5 sketch: Calculate virtual viewer position (`PointCoords`); draw it (dotted) using its `.x`, `.y`.
*   **Code Modules:** `lib/simulation.ts`, `lib/types.ts`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Calculate and draw virtual viewer image using @flatten-js/core (with coord translation)`

## Phase 3: Viewer Interaction (Drag & Drop)

*   **Goal:** Allow dragging viewer with boundary checks and drag-end state updates, using `PointCoords`.
*   **Tasks:**
    - [ ] Use React state (`useState`) for `sceneConfig` (containing `PointCoords`). Pass state and setter down.
    - [ ] **Implement Drag Logic (p5 sketch or hook):**
        - [ ] Internal State: `isDragging`, `draggedElementId`, `currentDragPosition: PointCoords | null`.
        - [ ] `mousePressed`: Identify element, set internal state. Store initial side relative to mirrors.
        - [ ] `mouseDragged`:
            - [ ] Calculate proposed `nextPosCoords: PointCoords`.
            - [ ] **Boundary Check:** **Translate `nextPosCoords` to a temporary `Flatten.Point`**. Verify against all mirrors using `@flatten-js/core` side-of-line checks.
            - [ ] If valid, update internal state `currentDragPosition` (as `PointCoords`).
            - [ ] Do NOT call `setSceneConfig`.
        - [ ] `mouseReleased`: If `isDragging`, update `sceneConfig` copy with final `currentDragPosition` (`PointCoords`). Call `setSceneConfig`. Reset internal drag state.
    - [ ] Modify p5 `draw` loop: If dragging, draw element using `currentDragPosition.x`, `.y`, else use `sceneConfig`. Dependent calculations use `sceneConfig` state.
*   **Code Modules:** `pages/index.tsx`, `components/SimulationCanvas.tsx`, `sketch/mainSketch.ts`, `hooks/useDraggableElement.ts`.
*   **Commit:** `feat: Enable dragging viewer with boundary checks and state update on drag end (using PointCoords)`

## Phase 4: Adding the Object

*   **Goal:** Add a physical object using `PointCoords`.
*   **Tasks:**
    - [ ] Define `ObjectElement` type (using `position: PointCoords`). Add object to `sceneConfig`.
    - [ ] Add drawing logic for the object shape (using `.x`, `.y`).
    - [ ] Use `calculateVirtualImagePosition` (which handles translation) for virtual object position. Draw virtual object.
*   **Code Modules:** `lib/types.ts`, `sketch/mainSketch.ts`, `pages/index.tsx`.
*   **Commit:** `feat: Add physical object and display its virtual image (using PointCoords)`

## Phase 5: Ray Path Calculation (Single Reflection)

*   **Goal:** Calculate ray path points using `@flatten-js/core`, managing coordinate translation.
*   **Tasks:**
    - [ ] Implement `calculateSingleReflectionPath(objPosCoords: PointCoords, viewPosCoords: PointCoords, mirror: MirrorElement): RayPath | null` in `lib/simulation.ts` (where `RayPath` might contain `PointCoords` or library types depending on preference - decide and be consistent).
        - [ ] **Translate Inputs:** Convert input `PointCoords` and mirror coords to `Flatten.Point`/`Segment`/`Line`.
        - [ ] Calculate virtual image position (`Flatten.Point`).
        - [ ] Define viewer-virtual segment (`Flatten.Segment`).
        - [ ] **Leverage `@flatten-js/core`:** Find intersection (`Flatten.Point`) using verified library methods.
        - [ ] **Leverage `@flatten-js/core`:** Check if intersection point is on mirror segment using verified library methods.
        - [ ] If valid, construct path data. **Translate points back to `PointCoords` if `RayPath` uses plain objects.**
        - [ ] Return `RayPath` or `null`.
*   **Code Modules:** `lib/simulation.ts`, `lib/types.ts`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Calculate single-reflection ray path points using @flatten-js/core (with coord translation)`

## Phase 6: Ray Path Drawing

*   **Goal:** Draw the calculated ray path from `RayPath` data.
*   **Tasks:**
    - [ ] In p5 sketch, use result from Phase 5. If valid path exists: Draw lines using the `.x`, `.y` properties of the `PointCoords` within the `RayPath` structure.
*   **Code Modules:** `sketch/mainSketch.ts`.
*   **Commit:** `feat: Draw solid ray path and dotted perceived path (from PointCoords)`

## Phase 7: Object Interaction (Drag & Drop)

*   **Goal:** Allow dragging the object with constraints, using `PointCoords`.
*   **Tasks:**
    - [ ] Extend Drag Logic from Phase 3 for the object element.
    - [ ] Apply boundary checks (involving temporary translation to `Flatten.Point`).
    - [ ] Ensure state update uses `PointCoords` and happens on drag end.
*   **Code Modules:** `pages/index.tsx`, `components/SimulationCanvas.tsx`, `sketch/mainSketch.ts`, `hooks/useDraggableElement.ts`.
*   **Commit:** `feat: Enable dragging object with boundary checks and state update on drag end (using PointCoords)`

## Phase 8: UI Controls & Visualization Options

*   **Goal:** Add basic React controls (toggles) for visualization clarity before adding multi-mirror complexity.
*   **Tasks:**
    - [ ] Add `visualizationParams` to `SceneConfig` (`showRayPaths`, `showVirtualImages`).
    - [ ] Create `ControlPanel.tsx` with checkboxes bound to state managing these params.
    - [ ] Update main page state and pass params down.
    - [ ] Modify p5 sketch drawing logic to conditionally draw based on flags.
*   **Code Modules:** `lib/types.ts`, `components/ControlPanel.tsx`, `pages/index.tsx`, `sketch/mainSketch.ts`.
*   **Commit:** `feat: Add UI toggles for showing/hiding rays and virtual images`

## Phase 9: Parallel Mirrors (Multiple Reflections) - **PRIORITY**

*   **Goal:** Implement multiple reflections, managing coordinate translations.
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
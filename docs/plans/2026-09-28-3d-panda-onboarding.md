# 3D Panda Onboarding Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn panda.fun's existing first-run onboarding into a performant, responsive cinematic 3D Panda experience while preserving every existing preference and completion behavior.

**Architecture:** Keep `PandaOnboarding` as the orchestration/state owner and introduce a lazily loaded Three.js scene behind an explicit animation-controller interface. The scene communicates only stage/interaction events to the existing onboarding UI; normal buttons, inputs, selects and toggles remain the source of truth. On completion the scene is stopped and all WebGL resources are disposed before the homepage resumes.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Three.js (new dependency), GLTFLoader, existing CSS/motion utilities, TypeScript compiler, Vite production build.

## Global Constraints

- Onboarding remains homepage-only and only appears when the existing `panda_onboarding_v1` state is absent.
- Preserve name, avatar, genre, audio language, subtitle language, autoplay, previews, skip-intro and skip-outro behavior.
- Preserve `panda_onboarding_complete` and player-preference integration.
- Use the hybrid Panda direction: cute rounded mascot proportions with cinematic materials, lighting and animation.
- Use a continuous dark cinematic environment with restrained bamboo silhouettes, leaves/particles, contact shadow and camera parallax.
- 3D animation is expressive only; accessible HTML controls remain the interaction mechanism.
- Never block navigation on an animation.
- Do not reintroduce the removed dedicated TV UI/player.
- Do not change movie API, playback provider, homepage content architecture, recommendations, or account/auth architecture.
- Do not initialize the 3D runtime for users who already completed onboarding.
- Dispose renderer, geometries, materials, textures, animation mixers/actions and model resources when onboarding closes.
- Provide a usable animated fallback if WebGL/model loading fails.
- Respect `prefers-reduced-motion`.
- Degrade environmental effects/render resolution on constrained devices.
- No blank-screen failure state.
- No third-party recognizable mascot imitation.
- Asset licensing/source must be explicit before production asset wiring; see unresolved decisions.

---

### Task 1: Establish the 3D runtime and Panda scene boundary

**Files:**
- Create: `src/components/ui/panda3d/PandaScene.tsx`
- Create: `src/components/ui/panda3d/PandaSceneController.ts`
- Create: `src/components/ui/panda3d/pandaSceneTypes.ts`
- Create: `src/components/ui/panda3d/usePandaScene.ts`
- Modify: `package.json`
- Modify: `src/components/ui/PandaOnboarding.tsx`
- Test: `src/components/ui/panda3d/PandaSceneController.test.ts` (proposed; test runner decision is unresolved)

**Interfaces:**
- Consumes: `PandaSceneStage`, `PandaSceneEvent`, `PandaSceneOptions`.
- Produces: `PandaSceneController.play(event)`, `PandaSceneController.dispose()`, and readiness/failure callbacks.
- `PandaSceneStage = 'welcome' | 'genres' | 'language' | 'playback' | 'ready' | 'exit'`.
- `PandaSceneEvent = 'arrive' | 'recognize' | 'genre-select' | 'language-select' | 'playback-toggle' | 'ready' | 'exit'`.
- `PandaSceneOptions = { reducedMotion: boolean; pixelRatioCap: number; onReady(): void; onError(error: unknown): void }`.

- [ ] **Step 1: Add the focused failing test**
  
Test the controller as a pure lifecycle boundary: a newly created controller is not disposed; `dispose()` becomes idempotent; `play()` after disposal is ignored; stage/event names are accepted without coupling the test to WebGL.

- [ ] **Step 2: Verify the relevant failure**
  
Run the repository's eventual test command once the test-runner choice is resolved. Expected: the new controller test fails because the controller and interfaces do not yet exist.

- [ ] **Step 3: Implement the minimum behavior**
  
Add Three.js and implement the controller as an imperative runtime boundary. Create the renderer only after the component mounts and only when the onboarding is actually visible. Set a bounded device-pixel-ratio, a transparent renderer, camera, ambient/key/fill lighting, floor/contact-shadow primitive and bounded particle/leaf layer. Keep all animation state inside the scene/controller rather than React state. Keep the controller methods safe when the model is still loading. Use dynamic loading so the Three.js code is not part of the initial homepage execution path.

- [ ] **Step 4: Verify the focused pass**
  
Run the focused controller test. Expected: all lifecycle assertions pass, including idempotent disposal and ignored post-disposal events.

- [ ] **Step 5: Run the affected integration check**
  
Run `npm run lint`. Expected: TypeScript reports no new errors.

- [ ] **Step 6: Commit the passing deliverable**
  
```bash
git add package.json src/components/ui/panda3d src/components/ui/PandaOnboarding.tsx
git commit -m "feat: establish Panda 3D onboarding scene"
```

---

### Task 2: Add the Panda model, animation state machine and cinematic interactions

**Files:**
- Create: `src/components/ui/panda3d/PandaModel.tsx`
- Create: `src/components/ui/panda3d/PandaEnvironment.tsx`
- Create: `src/components/ui/panda3d/PandaAnimationController.ts`
- Create: `src/components/ui/panda3d/assets/` for the approved Panda model/animation assets
- Modify: `src/components/ui/panda3d/PandaScene.tsx`
- Modify: `src/components/ui/panda3d/PandaSceneController.ts`
- Test: `src/components/ui/panda3d/PandaAnimationController.test.ts` (proposed; test runner decision is unresolved)

**Interfaces:**
- Consumes: `PandaSceneController.play()` and the approved Panda GLB/GLTF asset manifest.
- Produces: deterministic animation states `idle`, `walk-in`, `recognize`, `wave`, `react`, `remote-interaction`, `celebrate`, `walk-out`.
- Animation controller accepts interruption: a new event cancels/replaces only the currently interruptible clip and always returns to `idle` when appropriate.

- [ ] **Step 1: Add the focused failing test**
  
Test event-to-animation mapping: `arrive → walk-in`, `recognize → recognize + wave`, `genre-select → react`, `language-select → react`, `playback-toggle → remote-interaction`, `ready → celebrate`, `exit → walk-out`. Test rapid event replacement and reduced-motion mapping to short/no-motion states.

- [ ] **Step 2: Verify the relevant failure**
  
Run the focused animation-controller test. Expected: it fails because the animation state machine is not implemented.

- [ ] **Step 3: Implement the minimum behavior**
  
Load the approved GLB/GLTF with `GLTFLoader`. Use its named animation clips where available; otherwise compose the available clips into the required state transitions without pretending unsupported character joints exist. Add idle breathing, eye/blink behavior, head/eye tracking, weight shifts, ears/paws/head movement and locomotion only when supported by the asset. Build the environment from lightweight geometry/materials: bamboo silhouettes, floor shadow, bounded leaves/particles and soft lighting. Keep the cinema remote as a small 3D prop associated with playback interactions. Camera movement is deterministic and subtle.

- [ ] **Step 4: Verify the focused pass**
  
Run the focused animation-controller test. Expected: all event mappings, interruption behavior and reduced-motion assertions pass.

- [ ] **Step 5: Run the affected integration check**
  
Run `npm run build`. Expected: Vite completes production bundling and the server bundle builds without TypeScript/Vite errors.

- [ ] **Step 6: Commit the passing deliverable**
  
```bash
git add src/components/ui/panda3d
git commit -m "feat: animate cinematic Panda onboarding"
```

---

### Task 3: Replace the form-first presentation while preserving onboarding behavior and fallback paths

**Files:**
- Modify: `src/components/ui/PandaOnboarding.tsx`
- Modify: `src/index.css`
- Create: `src/components/ui/panda3d/PandaOnboardingFallback.tsx`
- Create: `src/components/ui/panda3d/PandaDialogue.tsx`
- Create: `src/components/ui/panda3d/PreferenceStage.tsx`
- Create: `src/components/ui/panda3d/CompletionTransition.tsx`
- Test: `src/components/ui/PandaOnboarding.test.tsx` (proposed; test runner decision is unresolved)

**Interfaces:**
- `PandaOnboarding` continues to own `OnboardingState`, persistence and completion.
- `PandaScene` receives current stage plus interaction events and emits `onReady`/`onError`.
- `PreferenceStage` receives the existing state/update callbacks and does not own persistence.
- `PandaOnboardingFallback` receives the same stage/state/update callbacks and must expose the same navigation and completion behavior.

- [ ] **Step 1: Add the focused failing test**
  
Test first-run visibility after `panda_intro_complete`; six preference stages; name validation; minimum three genres; playback toggles; completion writes `panda_onboarding_v1`; completion dispatches `panda_onboarding_complete`; skip preserves current skip behavior; scene failure renders fallback without removing controls.

- [ ] **Step 2: Verify the relevant failure**
  
Run the focused onboarding test. Expected: the new stage/component contract fails before integration.

- [ ] **Step 3: Implement the minimum behavior**
  
Refactor the existing JSX into stage-focused components without changing state shape or persistence semantics. Add the cinematic layout around the scene, with no oversized blocking modal. On welcome, trigger `arrive` then `recognize`; on each preference interaction trigger the corresponding expressive event; on ready trigger `ready`; on Enter trigger `exit`, then finish once the exit transition has been initiated rather than waiting on an unbounded animation. If 3D initialization fails, switch to the fallback immediately while retaining all controls. Use CSS only for UI transitions; character motion remains in the 3D runtime. Add accessible labels/focus states and keyboard-safe navigation. Add mobile/tablet/desktop composition rules and reduced-motion styles.

- [ ] **Step 4: Verify the focused pass**
  
Run the focused onboarding test. Expected: all state, validation, persistence, event and fallback assertions pass.

- [ ] **Step 5: Run the affected integration check**
  
Run `npm run lint && npm run build`. Expected: both commands complete successfully.

- [ ] **Step 6: Commit the passing deliverable**
  
```bash
git add src/components/ui/PandaOnboarding.tsx src/components/ui/panda3d src/index.css
git commit -m "feat: integrate cinematic Panda onboarding"
```

---

### Task 4: Verify runtime performance, responsive behavior and cleanup

**Files:**
- Modify: `src/components/ui/panda3d/PandaScene.tsx`
- Modify: `src/components/ui/panda3d/PandaSceneController.ts`
- Modify: `src/components/ui/PandaOnboarding.tsx`
- Modify: `src/index.css`
- Test: `src/components/ui/panda3d/PandaSceneController.test.ts`
- Test: `src/components/ui/PandaOnboarding.test.tsx`
- Optional proposed: `scripts/verify-panda-onboarding.mjs` if automated browser verification is needed

**Interfaces:**
- Consumes the complete onboarding scene/controller and existing Panda preference events.
- Produces a verified lifecycle: mount → load → animate → interact → complete/skip → dispose, with no required 3D runtime for completed users.

- [ ] **Step 1: Add the focused failing test**
  
Add assertions for: no scene mount when `panda_onboarding_v1` exists; renderer stops after completion/skip; disposal is safe when model loading is still pending; reduced-motion disables continuous camera/environment animation; fallback remains usable after a simulated load error.

- [ ] **Step 2: Verify the relevant failure**
  
Run the focused tests. Expected: lifecycle/performance assertions identify any missing cleanup or conditional loading behavior.

- [ ] **Step 3: Implement the minimum behavior**
  
Use Intersection/visibility state to pause rendering when hidden. Cap pixel ratio based on viewport/device constraints. Bound particles and effect intensity. Abort or ignore late model-load completion after disposal. Remove event listeners and animation frames on unmount. Ensure the onboarding DOM remains responsive while the scene is degraded or unavailable. Verify the homepage receives focus/interaction normally after onboarding closes.

- [ ] **Step 4: Verify the focused pass**
  
Run the focused test suite. Expected: cleanup, conditional loading, reduced-motion and fallback tests pass.

- [ ] **Step 5: Run the affected integration check**
  
Run `npm run lint && npm run build`. Then run the local app and verify at minimum: first-run welcome, genre selection, language selection, playback toggles, completion to Home, Skip, mobile viewport, reduced-motion, and simulated 3D failure. Expected: no console errors attributable to the onboarding implementation and no 3D resources remain active after exit.

- [ ] **Step 6: Commit the passing deliverable**
  
```bash
git add src/components/ui/panda3d src/components/ui/PandaOnboarding.tsx src/index.css
git commit -m "test: verify Panda onboarding lifecycle and performance"
```

---

## Unresolved product decisions

1. **Panda asset source:** The current repository search found no existing GLB/GLTF Panda asset. Before Task 2, choose one explicit source: (a) a newly commissioned/created Panda model owned/licensed for panda.fun, (b) a compatible licensed asset with redistribution rights, or (c) a temporary local placeholder asset for development only. This changes the asset-loading and licensing files but not the scene API.
2. **Animation asset strategy:** Decide whether the selected model supplies its own clips or whether separate animation clips will be imported/retargeted. The implementation must not assume clips that the chosen asset does not contain.
3. **Test runner:** `package.json` currently exposes `lint` and `build` but no test script/test dependency. Add a test runner only after choosing the repository-standard option; Vitest is the engineering recommendation because the project is Vite-based, but this is not a product requirement.
4. **Exit timing:** The proposed behavior is to start the exit animation and complete onboarding immediately enough to avoid blocking the user on a fixed animation duration. The exact visual overlap between Panda walk-out and homepage reveal can be tuned during implementation without changing the persistence contract.

# panda.fun 3D Onboarding Design

**Date:** 2026-09-28  
**Status:** Design approved for specification; implementation pending written-spec review

## 1. Goal

Replace the current form-first onboarding presentation with a short, cinematic 3D Panda experience that appears on the homepage only when onboarding is required.

The experience should make panda.fun feel like a distinctive streaming platform rather than a generic preference wizard. The Panda is the host of the experience: cute and expressive, but rendered and animated with a premium cinematic treatment.

## 2. Product experience

The onboarding flow is a continuous mini-story:

HOME → PANDA ARRIVES → WELCOME → YOUR TASTE → LANGUAGE → PLAYBACK → READY → PANDA EXITS → HOME

The same Panda character remains present throughout the experience. The environment, lighting and camera language remain continuous so the flow feels like one scene rather than unrelated screens.

### Welcome
- Homepage shell is already available behind the onboarding layer.
- Panda enters the scene rather than appearing instantly.
- Panda has visible locomotion: body movement, paw/leg motion, head motion and weight shift.
- Panda pauses, looks toward the viewer, blinks, tilts its head and gives a small wave.
- Welcome copy introduces panda.fun without a large obstructive modal.

### Taste / genres
- Genre choices remain selectable and retain the existing minimum-selection requirement.
- Preference cards are arranged with subtle depth rather than a flat dashboard grid.
- Selection produces immediate visual feedback.
- Panda reacts to selections with small, context-aware gestures.
- The UI remains readable and usable without requiring 3D interaction.

### Language
- Existing audio/subtitle language choices remain.
- A small cinematic translation/cinema-card interaction accompanies the selection.
- Panda can look toward or gesture toward the active choice.
- No unnecessary animation delays are introduced.

### Playback
- Existing playback preferences remain: autoplay, previews, skip intro and skip outro.
- Panda interacts with a small cinema remote/control object.
- Toggle changes produce restrained physical/visual reactions.
- The preferences continue to connect to the existing Panda/player preference system.

### Completion
- Panda reacts positively when setup is complete.
- Lighting/environment subtly becomes more alive.
- Camera makes a restrained cinematic push.
- Completion message communicates that the user's Panda is ready.
- Panda gives a final wave and exits naturally.
- The 3D layer is removed/disposed and the real homepage becomes the active experience.

## 3. Character direction

The Panda uses a hybrid style:
- Cute, rounded mascot proportions.
- Premium cinematic rendering.
- Expressive eyes and face.
- Subtle soft/fur-like material treatment where practical.
- Blinking and eye/head tracking.
- Ear, paw, head and body animation.
- Idle breathing and weight shifts.
- Animations should feel physically connected rather than independent CSS transforms.
- Avoid copying a recognizable third-party character design.

The Panda should feel like a mascot belonging specifically to panda.fun.

## 4. Environment and visual language

The 3D scene uses:
- Dark cinematic background.
- Subtle bamboo silhouettes.
- Soft ground/contact shadow.
- Floating leaves and restrained particles.
- Soft volumetric-style lighting where performance allows.
- Depth/parallax.
- Controlled camera movement.
- Gentle depth-of-field treatment only where it does not harm readability/performance.

The scene should remain visually dark enough for the Panda and onboarding controls to read clearly. Bright neon/dashboard styling is out of scope.

## 5. Technical architecture

The onboarding is split into focused responsibilities:

PandaOnboarding
- Owns onboarding state and persistence.
- Coordinates the preference stages.
- Starts/stops the 3D experience.

PandaScene
- Owns the 3D canvas/runtime.
- Coordinates camera, lighting, environment and effects.
- Exposes a small animation API to the onboarding controller.

Panda3D
- Loads and renders the Panda model.
- Owns character animation state.
- Handles idle and stage-specific animation triggers.

Environment
- Bamboo, particles, leaves, floor/shadow and environmental lighting.

PandaDialogue
- Owns cinematic copy and readable controls.

PreferenceStage
- Owns genres, language and playback controls using existing application state.

CompletionTransition
- Coordinates the final Panda animation and transition back to Home.

The intended state machine is:

WELCOME
  ↓
GENRES
  ↓
LANGUAGE
  ↓
PLAYBACK
  ↓
READY
  ↓
EXIT_TO_HOME

The existing onboarding persistence/event behavior remains compatible with the redesign unless a targeted migration is required.

## 6. Asset/loading strategy

3D assets must not block the normal panda.fun homepage.

Rules:
- Do not initialize the 3D engine for returning users who have already completed onboarding.
- Load the onboarding shell immediately.
- Preload the Panda model and required animation assets while the shell is visible.
- Keep large textures and optional effects optimized.
- Cache reusable assets where appropriate.
- Lazy-load the 3D runtime.
- Pause rendering when the scene is not visible.
- Dispose of WebGL resources when onboarding ends.
- Avoid retaining the canvas/model in memory after completion.

The target is a visually rich scene without turning onboarding into a long loading screen.

## 7. Fallback behavior

If WebGL is unavailable, initialization fails, or a model/asset cannot load:
- Do not show a blank screen.
- Preserve the complete onboarding functionality.
- Fall back to a lightweight animated Panda presentation.
- Keep the same stage order, copy and preference controls.
- Do not require the user to retry or install anything.

Reduced-motion users should receive a substantially simplified animation path while retaining all functionality.

## 8. Responsive behavior

Desktop:
- Large cinematic Panda composition.
- Controls positioned around the character without obscuring it.
- Camera framing uses available viewport width.

Tablet:
- Balanced character and control composition.
- Reduced environmental effects when required.

Mobile:
- Compact Panda composition.
- Controls remain primary and comfortably tappable.
- Avoid forcing a large desktop-style scene into a narrow viewport.

The implementation should remain structurally compatible with future remote-control/TV interaction without recreating the removed dedicated TV UI.

## 9. Performance requirements

Performance is a first-class requirement:
- Avoid continuous expensive effects when they provide little visual benefit.
- Cap render resolution on constrained devices.
- Prefer baked/static environment elements over expensive dynamic simulation.
- Keep particle counts bounded.
- Use animation clips instead of per-frame React state updates for character motion.
- Avoid unnecessary component rerenders.
- Pause/cleanup resources correctly.
- Respect reduced-motion preferences.
- Maintain usable onboarding controls even if visual effects are degraded.

## 10. Interaction principles

The 3D Panda is primarily expressive, not the control mechanism.

Users should always interact with normal accessible UI controls. 3D animation provides feedback and personality.

Animations must:
- Never trap the user.
- Never require waiting through an animation to change a selection.
- Never hide the active control.
- Never prevent keyboard/touch navigation.
- Have reduced-motion behavior.
- Have sensible interruption behavior when the user moves quickly between stages.

## 11. Existing functionality preserved

The redesign must preserve:
- Panda name selection/input.
- Avatar selection where still supported by the current onboarding data model.
- Genre selection and validation.
- Audio/subtitle language selection.
- Autoplay preference.
- Trailer preview preference.
- Skip-intro preference.
- Skip-outro preference.
- Existing onboarding completion persistence.
- Existing onboarding completion event integration.
- Existing player preference synchronization.

The visual redesign must not require an API/playback rewrite.

## 12. Scope boundaries

In scope:
- 3D Panda onboarding scene.
- Character animation system.
- Cinematic environment.
- Onboarding transitions.
- Responsive behavior.
- Loading/fallback handling.
- Reduced-motion support.
- Integration with existing onboarding preferences.

Out of scope:
- Dedicated TV UI.
- Rebuilding the video player.
- Rebuilding the movie API.
- Replacing the homepage content architecture.
- New recommendation algorithms.
- Full account/authentication redesign.

## 13. Acceptance criteria

The implementation is considered successful when:
1. A new user sees the Panda onboarding on the homepage rather than a generic form-first presentation.
2. The Panda visibly enters and performs coherent character animation.
3. The Panda remains visually integrated with one continuous cinematic environment.
4. Genre, language and playback choices remain fully functional.
5. Panda reactions correspond to onboarding stages without blocking interaction.
6. Completing onboarding transitions cleanly into the real homepage.
7. Returning users who completed onboarding do not pay the 3D loading cost.
8. WebGL/model failure produces a usable fallback.
9. Reduced-motion users receive an appropriate simplified experience.
10. Mobile and desktop layouts remain usable.
11. 3D resources are disposed after onboarding.
12. Existing onboarding preference persistence/player integration continues to work.
13. No dedicated TV UI or player is reintroduced.

## 14. Implementation boundary

Implementation should begin only after this written specification is reviewed and approved. The next implementation step is a focused implementation plan covering asset strategy, component changes, dependencies, animation state, tests and verification.

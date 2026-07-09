// src/data/foundationScenes.js — registry that lets renderMd() interleave interactive
// scenes INSIDE a module's prose flow, ported from GSL's
// src/components/nicheViz/foundationScenes.jsx (same convention, same mechanism).
//
// Opt-in per module: instead of passing a plain string to renderMd() (unchanged, existing
// behavior), pass an ARRAY of blocks where one item is `{ type: 'scene', sceneId: '<id>' }`.
// renderMd() looks up FOUNDATION_SCENES[`${moduleId}/${sceneId}`] and renders that component
// inline, at that exact position in the sequence, between the surrounding prose blocks.
//
// Unknown ids (or no moduleId passed) no-op — renderMd() simply skips the block — so this is
// safe to reference before content exists, and safe for every one of the ~203 existing calls
// that still pass a plain string with no moduleId.
//
// Keyed exactly like GSL: `${moduleId}/${sceneId}`. First real content entries added
// 2026-07-09 for the `gradient_boosting` reference-template rewrite (docs/BACKLOG.md).

import {
  GBResidualRelayScene,
  GBGainBarsScene,
  GBMissingRouteScene,
} from '../components/interactive/GradientBoostingScenes.jsx';

export const FOUNDATION_SCENES = {
  'gradient_boosting/residual_relay': GBResidualRelayScene,
  'gradient_boosting/gain_bars': GBGainBarsScene,
  'gradient_boosting/missing_route': GBMissingRouteScene,
}

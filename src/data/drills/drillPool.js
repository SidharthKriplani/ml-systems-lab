// drillPool.js — the normalized JUDGE drill pool (slice / proof-of-model).
// One shape for every judgment drill, tagged so the browser derives its facets.
// This is the target schema the full migration normalizes all ~450 items into.
//
// Drill = {
//   id, subject, subtopic, level('junior'|'mid'|'senior'|'staff'),
//   type('mcq'|'code'|'multistep'|'open'|'rubric'),
//   title, context(string|string[]), question,
//   options[str], answer(int),                // mcq / code
//   code?,                                     // code
//   steps?[{question, options[str], answer, finding}],  // multistep
//   diagnosis?, explanation?, fix?,            // reveal
//   levels?{ic3, ic5, staff},                  // dissolved Staff Layer framing
//   source                                     // provenance (which old tab it came from)
// }

import { EVAL_DRILLS } from './eval.js'
import { CAUSAL_DRILLS } from './causal.js'
import { DL_DRILLS } from './deepLearning.js'
import { SYSDESIGN_DRILLS } from './systemDesign.js'
import { PRODUCTION_DRILLS } from './production.js'
import { CLASSICAL_DRILLS } from './classical.js'
import { DATA_DRILLS } from './data.js'
import { TIMESERIES_DRILLS } from './timeSeries.js'
import { MONITORING_DRILLS } from './monitoring.js'
import { SPOTFLAW_DRILLS } from './spotFlaw.js'
import { AUTHORED_DRILLS } from './authored.js'

export const SUBJECT_LABELS = {
  eval: 'Model evaluation',
  causal: 'Causal inference',
  deep_learning: 'Deep learning',
  monitoring: 'Monitoring',
  production: 'Production / serving',
  system_design: 'System design',
  classical_ml: 'Classical ML',
  data: 'Data & features',
  time_series: 'Time series',
}

const SEED = [
  {
    id: 'eval-calib-overconfident',
    subject: 'eval', subtopic: 'calibration', level: 'senior', type: 'mcq',
    title: 'Model outputs 0.95 but only 61% of those are positive',
    context: [
      'Reliability diagram: predicted-0.95 bucket → actual positive rate 0.61',
      'Model: gradient-boosted tree, 500k samples',
      'ECE (expected calibration error): 0.18',
      'Deployment: fraud scoring — probabilities feed a decision engine',
    ],
    question: 'What is the primary problem and how should you fix it?',
    options: [
      'Underfitting — improve features',
      'Overconfident model — apply Platt scaling or isotonic regression',
      'Threshold too high — lower it to 0.5',
      'ECE of 0.18 is acceptable for this domain',
    ],
    answer: 1,
    diagnosis: 'Overconfident model — needs post-hoc calibration',
    explanation: 'ECE 0.18 is severely miscalibrated. The 0.95 bucket being only 61% positive means the fraud engine is deciding on inflated confidence. GBTs and neural nets are systematically overconfident; post-hoc calibration corrects it without retraining.',
    fix: 'Platt scaling (logistic on a held-out set) for small calibration sets; isotonic regression above ~1k samples. Calibrate on a set separate from the one you evaluate on.',
    levels: {
      ic3: 'Lower the threshold so fewer things get flagged.',
      ic5: 'Fit Platt/isotonic on a held-out calibration set, re-measure ECE, and gate the decision engine on calibrated scores.',
      staff: 'The score feeds a downstream decision, so calibration is a product requirement, not a model nicety. Own the calibration set as a rolling artifact, monitor ECE in prod, and recalibrate on base-rate shift — the model can be fine while the mapping goes stale.',
    },
    source: 'ModelEval · Calibration Clinic',
  },
  {
    id: 'eval-validation-peeking',
    subject: 'eval', subtopic: 'validation traps', level: 'mid', type: 'mcq',
    title: 'A/B test called a win on day 7 after checking days 3, 5, 7',
    context: [
      'Control 3.21% vs treatment 3.47% conversion',
      'Two-proportion z-test, p = 0.031 at day 7',
      'Checked day 3 (p=0.12) and day 5 (p=0.08) first, shipped when it crossed 0.05',
    ],
    question: 'What is the buried flaw?',
    options: [
      'Sample size too small',
      'Peeking / optional stopping inflates the false-positive rate',
      'Conversion is the wrong metric',
      'Treatment leaked into control',
    ],
    answer: 1,
    diagnosis: 'Peeking — repeated looks inflate the false-positive rate',
    explanation: 'Three looks at α=0.05 give a family-wise error near 14%. The observed p=0.031 does not represent a 3.1% false-positive rate — it represents a much higher one because three implicit tests were run.',
    fix: 'Pre-register the end date and do not test until then; if you must monitor continuously, use always-valid p-values / mSPRT.',
    source: 'Spot the Flaw · stf2',
  },
  {
    id: 'causal-framing-prediction-vs-causal',
    subject: 'causal', subtopic: 'problem framing', level: 'mid', type: 'mcq',
    title: 'Which users are most likely to churn — so we can send a discount',
    context: ['Product team wants to target at-risk users with a retention discount.'],
    question: 'Is this a prediction problem or a causal one?',
    options: [
      'Prediction — rank users by churn probability',
      'Causal — estimate who the discount actually changes (uplift), not who churns',
    ],
    answer: 1,
    diagnosis: 'Causal / uplift — the intervention is the point',
    explanation: 'Ranking by churn probability targets sure-things and sleeping-dogs. The business question is who the discount *changes* — that is an uplift (CATE) problem, not a churn-prediction one. Targeting by predicted churn spends budget where it has no incremental effect.',
    fix: 'Estimate treatment effect per user (T-/X-learner, uplift trees), target high-uplift segments, and validate with a holdout via a Qini/uplift curve.',
    source: 'Causal · Causal-vs-Predictive',
  },
  {
    id: 'dl-gradients-vanishing',
    subject: 'deep_learning', subtopic: 'gradients', level: 'senior', type: 'mcq',
    title: 'Layers 1–6 have gradient norms < 1e-6, layers 7–12 are normal',
    context: [
      'Layer 12 grad_norm 0.42 · layer 8 0.31 · layer 6 3e-6 · layer 1 1e-7',
      'Activation: sigmoid, 12-layer network',
    ],
    question: 'What is happening and how does it affect early vs late layers?',
    options: [
      'Exploding gradients in early layers',
      'Vanishing gradients — sigmoid saturation compounds through depth',
      'A gradient-checkpoint bug',
      'Wrong loss function',
    ],
    answer: 1,
    diagnosis: 'Vanishing gradients (sigmoid saturation)',
    explanation: "Sigmoid's derivative maxes at 0.25; through 12 layers, 0.25^12 ≈ 6e-8. The sharp cutoff at layer 6 is where saturation becomes total, so early layers stop learning and the depth is wasted.",
    fix: 'Swap sigmoid for ReLU/GELU, add LayerNorm between blocks, and use residual connections to give gradients a highway back.',
    source: 'Deep Learning · Backprop Debugging',
  },
  {
    id: 'monitoring-incident-zero-variance',
    subject: 'monitoring', subtopic: 'incident diagnosis', level: 'staff', type: 'multistep',
    title: 'Batch scoring produced identical predictions for all 2.1M users',
    context: ['Accuracy on the eval set is fine, but every user scored 0.493. A campaign launches in 3 hours.'],
    steps: [
      {
        question: 'Accuracy is fine but all predictions are identical. First move?',
        options: [
          'The calibration step has a bug',
          'All input features are the same value — the batch job read the wrong feature snapshot',
          'The sigmoid saturated',
          'The model file is corrupt',
        ],
        answer: 1,
        finding: 'Zero-variance output means zero-variance input. The batch job read a hardcoded feature_snapshot_date = 2024-01-01, so every user got the same stale feature row.',
      },
      {
        question: 'The snapshot date is hardcoded. What ships in 3 hours, and what fixes the class of bug?',
        options: [
          'Retrain the model on fresh data',
          'Re-run scoring against the current snapshot; add a pre-scoring input-variance check that fails loud',
          'Lower the decision threshold to spread predictions out',
          'Roll back to yesterday’s model',
        ],
        answer: 1,
        finding: 'The model is fine — the pipeline fed it a frozen snapshot. Re-point to the current snapshot and add a guardrail asserting input feature variance > 0 before scoring, so a stuck snapshot fails the job instead of shipping garbage.',
      },
    ],
    diagnosis: 'Data problem, not a model problem — a frozen feature snapshot',
    explanation: 'Zero-variance predictions are always an input problem. The instinct to check the model (sigmoid, weights, calibration) before the inputs wastes the exact hours you do not have.',
    fix: 'Input-variance assertions in the scoring job; alert on prediction-distribution collapse; never hardcode snapshot dates.',
    source: 'Incident Room · inc6',
  },
  {
    id: 'prod-serving-column-order',
    subject: 'production', subtopic: 'serving', level: 'senior', type: 'code',
    title: 'Predictions are systematically wrong — no exception raised',
    context: ['A trained sklearn model is served behind FastAPI. Outputs look plausible but are consistently off. No error is thrown.'],
    code: `model = joblib.load('model.pkl')

def predict(request_data: dict) -> float:
    df = pd.DataFrame([request_data])
    # model expects: ['age','income','tenure','product_count']
    return model.predict_proba(df)[0][1]`,
    question: 'What is the bug?',
    options: [
      'Should use predict() not predict_proba()',
      'Dict→DataFrame does not guarantee column order — sklearn silently accepts misaligned columns',
      'FastAPI dicts are always ordered correctly',
      'Missing dtype validation',
    ],
    answer: 1,
    diagnosis: 'Silent column-order mismatch',
    explanation: 'Dict insertion order is not the training feature order. sklearn takes the columns positionally with no error, so income lands in the age slot and every prediction is quietly wrong.',
    fix: 'Reorder explicitly: `df = pd.DataFrame([request_data])[FEATURE_COLUMNS]`. Better, validate the schema at the boundary.',
    source: 'Bug Hunt · SD1 (→ DO)',
  },
]

export const DRILL_POOL = [
  ...SEED,
  ...EVAL_DRILLS,
  ...CAUSAL_DRILLS,
  ...DL_DRILLS,
  ...SYSDESIGN_DRILLS,
  ...PRODUCTION_DRILLS,
  ...CLASSICAL_DRILLS,
  ...DATA_DRILLS,
  ...TIMESERIES_DRILLS,
  ...MONITORING_DRILLS,
  ...SPOTFLAW_DRILLS,
  ...AUTHORED_DRILLS,
]

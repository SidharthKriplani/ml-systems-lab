// foundationsModuleIndex.js — flat, searchable index of EVERY foundation module
// across all families, so the Content Map (Cmd+K) search can find modules by
// title/subtitle (e.g. "data quality audit"), not just tabs.
//
// Each entry: { id: <family tabId>, moduleId, label, desc, domain }
//   - `id` is the tab to open; `moduleId` is set into localStorage 'msl_goto_module'
//     by ContentMap so the family tab scrolls to / opens that exact module.
//
// The family → tabId/label mapping mirrors the FAMILIES registry in ReviewTab.jsx.

import { MATH_STATS_MODULES }     from './foundations/mathStatsModules.js'
import { CLASSICAL_ML_MODULES }   from './foundations/classicalMLModules.js'
import { PROBABILISTIC_ML_MODULES } from './foundations/probabilisticMLModules.js'
import { EVAL_MODULES }           from './foundations/evalModules.js'
import { UNSUPERVISED_MODULES }   from './foundations/unsupervisedModules.js'
import { CAUSAL_MODULES }         from './foundations/causalModules.js'
import { DEEP_LEARNING_MODULES }  from './foundations/deepLearningModules.js'
import { SELF_SUPERVISED_MODULES } from './foundations/selfSupervisedModules.js'
import { RL_MODULES }             from './foundations/rlModules.js'
import { PRODUCTION_MODULES }     from './foundations/productionModules.js'
import { MONITORING_MODULES }     from './foundations/monitoringModules.js'
import { SYSTEM_DESIGN_MODULES }  from './foundations/systemDesignModules.js'
import { RECSYS_MODULES }         from './foundations/recsysModules.js'
import { PRICING_MODULES }        from './foundations/pricingModules.js'
import { TIME_SERIES_MODULES }    from './foundations/timeSeriesModules.js'
import { GRAPH_ML_MODULES }       from './foundations/graphMLModules.js'
import { BANDITS_MODULES }        from './foundations/banditsModules.js'
import { OPTIMIZATION_MODULES }   from './foundations/optimizationModules.js'
import { DATA_MODULES }           from './foundations/dataModules.js'

const FAMILIES = [
  { tabId: 'math_stats_foundation',     label: 'Math & Stats',        modules: MATH_STATS_MODULES },
  { tabId: 'classical_ml_foundation',   label: 'Classical ML',        modules: CLASSICAL_ML_MODULES },
  { tabId: 'probabilistic_ml_foundation', label: 'Probabilistic ML',  modules: PROBABILISTIC_ML_MODULES },
  { tabId: 'eval_foundation',           label: 'Evaluation',          modules: EVAL_MODULES },
  { tabId: 'unsupervised_foundation',   label: 'Unsupervised',        modules: UNSUPERVISED_MODULES },
  { tabId: 'causal_foundation',         label: 'Causal',              modules: CAUSAL_MODULES },
  { tabId: 'dl_foundation',             label: 'Deep Learning',       modules: DEEP_LEARNING_MODULES },
  { tabId: 'self_supervised_foundation', label: 'Self-supervised',    modules: SELF_SUPERVISED_MODULES },
  { tabId: 'rl_foundation',             label: 'Reinforcement Learning', modules: RL_MODULES },
  { tabId: 'production_foundation',     label: 'Production',          modules: PRODUCTION_MODULES },
  { tabId: 'monitoring_foundation',     label: 'Monitoring',          modules: MONITORING_MODULES },
  { tabId: 'system_design_foundation',  label: 'System Design',       modules: SYSTEM_DESIGN_MODULES },
  { tabId: 'recsys_foundation',         label: 'Recommender Systems', modules: RECSYS_MODULES },
  { tabId: 'pricing_foundation',        label: 'Pricing Analytics',   modules: PRICING_MODULES },
  { tabId: 'time_series_foundation',    label: 'Time Series',         modules: TIME_SERIES_MODULES },
  { tabId: 'graph_ml_foundation',       label: 'Graph ML',            modules: GRAPH_ML_MODULES },
  { tabId: 'bandits_foundation',        label: 'Bandits',             modules: BANDITS_MODULES },
  { tabId: 'optimization_foundation',   label: 'Optimization',        modules: OPTIMIZATION_MODULES },
  { tabId: 'data_foundation',           label: 'Data',                modules: DATA_MODULES },
]

export const FOUNDATION_MODULE_INDEX = FAMILIES.flatMap(f =>
  (f.modules || []).map(m => ({
    id: f.tabId,
    moduleId: m.id,
    label: m.title || m.id,
    desc: (m.subtitle || m.summary || '').toString().slice(0, 140),
    domain: f.label + ' Foundations',
  }))
)

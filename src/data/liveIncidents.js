// src/data/liveIncidents.js — Live Incidents: stateful, time-budgeted sev-1
// simulations (2026-07-16). Unlike the branching-MCQ incidents, these have:
//   · a TIME BUDGET — every action costs minutes; run out and the incident
//     escalates on its own
//   · EVOLVING STATE — findings depend on the path taken, and some actions
//     make things actively worse (traps a real on-call can fall into)
//   · graded endings — resolved / mitigated / escalated
//
// Engine contract (see components/LiveIncident.jsx):
//   incident = { id, title, domain, budgetMin, briefing, start, nodes }
//   nodes[nodeId] = { situation, actions: [{ text, costMin, goto, tone? }] }
//     tone: 'trap' marks actions the debrief calls out (never shown up front).
//   terminal nodes: { outcome: 'resolved'|'mitigated'|'escalated', debrief }
//   The graph is validated (every goto resolves, terminals reachable) before ship.

export const LIVE_INCIDENTS = [
  {
    id: 'live1',
    title: 'Fraud model precision is collapsing — and nobody changed the model',
    domain: 'Labels → Training → Monitoring',
    budgetMin: 60,
    briefing:
      'Saturday 09:12. Pager: fraud-model precision alert. Ops report the model has been ' +
      'blocking a rising share of LEGITIMATE payments since Thursday — customer complaints up 4x. ' +
      'The model binary hasn\'t changed in 3 weeks. Auto-retrain runs nightly. ' +
      'Every action costs wall-clock minutes; at 60 minutes the payments VP escalates and forces a full model shutdown (manual review for all traffic).',
    start: 'triage',
    nodes: {
      triage: {
        situation:
          'Dashboard: precision 0.91 → 0.62 over 48h, recall roughly flat. Feature drift monitors: all green. ' +
          'The model file hash changed nightly as always (auto-retrain). Where do you look first?',
        actions: [
          { text: 'Diff the last 5 nightly training runs — metrics, data volumes, label counts', costMin: 10, goto: 'train_diff' },
          { text: 'Roll back to the model from 4 days ago and watch precision', costMin: 15, goto: 'rollback_first' },
          { text: 'Grep serving logs for feature anomalies on blocked-but-legit transactions', costMin: 15, goto: 'serving_logs' },
          { text: 'Restart the serving fleet — clears any bad cached state', costMin: 10, goto: 'restart_fleet', tone: 'trap' },
        ],
      },
      restart_fleet: {
        situation:
          'Fleet restarted. Cold caches push P95 latency to 3x for 20 minutes; checkout conversion dips; ' +
          'the payments VP is now watching the incident channel. Precision unchanged — the problem was never serving state.',
        actions: [
          { text: 'OK. Diff the nightly training runs — metrics, volumes, label counts', costMin: 10, goto: 'train_diff' },
          { text: 'Roll back to the 4-day-old model', costMin: 15, goto: 'rollback_first' },
        ],
      },
      serving_logs: {
        situation:
          'Sampled 50 blocked-but-legit transactions: features look ordinary. Scores cluster just above the block threshold ' +
          '(0.81–0.88 vs threshold 0.80) — the model has become systematically more aggressive, not spiky. ' +
          'That pattern smells like TRAINING, not serving.',
        actions: [
          { text: 'Diff the nightly training runs', costMin: 10, goto: 'train_diff' },
          { text: 'Raise the block threshold from 0.80 to 0.90 to stop the bleeding while investigating', costMin: 5, goto: 'threshold_bandaid' },
        ],
      },
      threshold_bandaid: {
        situation:
          'Threshold raised. Complaints slow — but you\'ve also cut fraud catch-rate by an unknown amount, silently. ' +
          'Risk team pings: "did fraud recall just drop?" You still don\'t know the root cause, and tonight\'s retrain will shift scores again under your new threshold.',
        actions: [
          { text: 'Now diff the nightly training runs', costMin: 10, goto: 'train_diff' },
          { text: 'Declare mitigated — write it up and hand off to the weekday team', costMin: 5, goto: 'end_bandaid' },
        ],
      },
      rollback_first: {
        situation:
          'Rolled back to the 4-day-old model. Precision recovers to 0.88 within the hour. Good instinct — but the nightly ' +
          'auto-retrain kicks off at 02:00 and will REPLACE your rollback with a fresh model trained on the same (bad?) data. ' +
          'You still don\'t know what\'s poisoning training.',
        actions: [
          { text: 'Freeze the auto-retrain pipeline, THEN diff the training runs', costMin: 10, goto: 'train_diff_frozen' },
          { text: 'Diff the training runs (leave the retrain scheduled — it might be fine)', costMin: 10, goto: 'train_diff_race' },
        ],
      },
      train_diff: {
        situation:
          'Run diff: Thursday\'s run onward, POSITIVE labels (fraud) are up 3.1x while transaction volume is flat. ' +
          'Someone or something is labeling far more history as fraud. The label source is the chargebacks ETL.',
        actions: [
          { text: 'Inspect the chargebacks ETL — recent changes, backfills, timestamps', costMin: 10, goto: 'etl_inspect' },
          { text: 'Assume label spam and add a hard cap on positive-label rate in training config', costMin: 10, goto: 'label_cap', tone: 'trap' },
        ],
      },
      train_diff_frozen: {
        situation:
          'Retrain frozen — the rollback will hold. Run diff shows the same anomaly: positive labels up 3.1x since Thursday, ' +
          'transaction volume flat. Label source: the chargebacks ETL.',
        actions: [
          { text: 'Inspect the chargebacks ETL — recent changes, backfills, timestamps', costMin: 10, goto: 'etl_inspect_frozen' },
        ],
      },
      train_diff_race: {
        situation:
          'Diff shows positive labels up 3.1x since Thursday (chargebacks ETL is the source). But it\'s taken time — ' +
          'and the 02:00 auto-retrain is now inside its cutoff window. If you don\'t freeze it NOW, tonight\'s model retrains on poisoned labels and overwrites your rollback.',
        actions: [
          { text: 'Freeze the retrain, then inspect the chargebacks ETL', costMin: 10, goto: 'etl_inspect_frozen' },
          { text: 'Let it run — inspect the ETL first', costMin: 10, goto: 'etl_inspect_race' },
        ],
      },
      label_cap: {
        situation:
          'You capped the positive-label rate. Training "stabilizes" — by silently discarding whichever labels exceed the cap, ' +
          'including REAL fraud. You\'ve hidden the symptom inside the training config. The chargebacks ETL is still wrong, and now the data AND the patch both lie.',
        actions: [
          { text: 'Revert the cap. Inspect the chargebacks ETL properly', costMin: 10, goto: 'etl_inspect' },
        ],
      },
      etl_inspect: {
        situation:
          'Found it. Wednesday night a chargebacks BACKFILL re-imported 90 days of disputes — but the import mapped ' +
          'dispute_opened_at into the transaction_time column. Result: thousands of old chargebacks now attach fraud labels to RECENT legitimate transactions. ' +
          'Every nightly retrain since has learned "normal recent behavior = fraud".',
        actions: [
          { text: 'Freeze auto-retrain, revert the backfill, retrain from the last clean label snapshot, then unfreeze', costMin: 15, goto: 'end_resolved' },
          { text: 'Revert the backfill and let tonight\'s scheduled retrain pick up the fix', costMin: 10, goto: 'end_partial' },
        ],
      },
      etl_inspect_frozen: {
        situation:
          'Found it. Wednesday\'s chargebacks backfill mapped dispute_opened_at into transaction_time — old disputes are attaching ' +
          'fraud labels to recent legitimate transactions. Your retrain freeze means no new poisoned model can ship. Clean path is open.',
        actions: [
          { text: 'Revert the backfill, retrain from the last clean label snapshot, verify precision offline, unfreeze', costMin: 15, goto: 'end_resolved' },
        ],
      },
      etl_inspect_race: {
        situation:
          'Found the backfill bug — but while you read ETL code, the 02:00 retrain fired and shipped a fresh model trained on poisoned labels. ' +
          'Precision is degrading again on live traffic. You now have to freeze, revert, retrain, and redeploy under pressure.',
        actions: [
          { text: 'Freeze retrain, revert backfill, emergency retrain from clean snapshot, redeploy', costMin: 20, goto: 'end_late' },
        ],
      },
      end_resolved: { outcome: 'resolved',
        debrief:
          'Textbook. Root cause: a backfill wrote dispute_opened_at into transaction_time, attaching stale fraud labels to fresh legitimate traffic — label corruption, invisible to feature-drift monitors (features never changed; the LABELS did). ' +
          'Winning sequence: training-run diff (labels 3.1x = the loudest signal in the room) → ETL inspection → freeze-revert-retrain in the right order. ' +
          'Traps avoided: fleet restart (serving was never implicated — and it burned trust), threshold band-aid (hides the symptom, silently trades recall), label cap (config that lies about data). ' +
          'Standing lesson: label pipelines need their own drift monitor — positive-rate per day is one line of SQL and would have paged on Thursday.' },
      end_partial: { outcome: 'mitigated',
        debrief:
          'Root cause found and reverted — but leaving the retrain scheduled instead of retraining from a clean snapshot means one more day of degraded precision (tonight\'s run still trains on partially-poisoned rolling windows). ' +
          'Mitigated, not resolved: the fix is IN, the recovery is slower than it needed to be. In a real postmortem this reads: "correct diagnosis, incomplete remediation."' },
      end_late: { outcome: 'mitigated',
        debrief:
          'You found the truth but lost the race: leaving the 02:00 retrain armed while reading ETL code shipped one more poisoned model to production. ' +
          'The instinct to understand before acting is right for DIAGNOSIS — but freezing an automated pipeline that ships models is containment, and containment comes first. ' +
          'Freeze costs 10 minutes; the race cost a night of bad blocks plus an emergency redeploy.' },
      end_bandaid: { outcome: 'escalated',
        debrief:
          'The threshold change slowed complaints while the root cause kept poisoning every nightly retrain. By Monday the score distribution had shifted under the new threshold, fraud recall had quietly cratered, and the weekday team inherited a worse incident with a misleading patch on top. ' +
          'A mitigation you can\'t explain is a time bomb: never hand off a band-aid without a root cause attached.' },
    },
  },

  {
    id: 'live2',
    title: 'Feature store P99 melting during the biggest sale of the year',
    domain: 'Serving → Caching → Capacity',
    budgetMin: 45,
    briefing:
      'Flash-sale launch, minute 8. Feature-store P99 is 1400ms against a 150ms SLO; the ranking service is timing out and falling back to popularity ordering — revenue per session is down 18%. ' +
      'Traffic is 3.2x forecast. At 45 minutes the sale\'s peak window ends and whatever happened, happened.',
    start: 'triage',
    nodes: {
      triage: {
        situation:
          'Grafana: feature-store CPU 71% (not saturated), memory fine, network fine. Cache hit rate: 92% → 61% and falling. ' +
          'P99 is melting but P50 is only 2x normal — the pain is concentrated in a tail.',
        actions: [
          { text: 'Break down latency by feature key — is the tail specific keys or uniform?', costMin: 5, goto: 'key_breakdown' },
          { text: 'Double the feature-store replicas — traffic is 3.2x, capacity must be the issue', costMin: 10, goto: 'scale_out', tone: 'trap' },
          { text: 'Restart the cache tier to clear possible corruption', costMin: 8, goto: 'cache_restart', tone: 'trap' },
        ],
      },
      cache_restart: {
        situation:
          'Cache restarted — hit rate falls to 0% and every request stampedes the backing store. P99 goes VERTICAL (4s+); ' +
          'ranking fallback rate hits 100% for six minutes while the cache warms. The incident channel is not kind. Hit rate crawls back to ~55%.',
        actions: [
          { text: 'Break down latency by feature key', costMin: 5, goto: 'key_breakdown' },
        ],
      },
      scale_out: {
        situation:
          'Replicas doubled. P99 improves 15% — nowhere near the SLO. CPU was never the constraint (71%). ' +
          'Meanwhile the cache hit rate is still falling: 61% → 54%. Something about THIS traffic defeats the cache.',
        actions: [
          { text: 'Break down latency by feature key', costMin: 5, goto: 'key_breakdown' },
          { text: 'Double replicas AGAIN', costMin: 10, goto: 'scale_again', tone: 'trap' },
        ],
      },
      scale_again: {
        situation:
          'Quadrupled capacity. P99 barely moves. You\'ve spent budget and doubled the infra bill to serve a workload whose problem is not capacity. Hit rate: 51%.',
        actions: [
          { text: 'Break down latency by feature key', costMin: 5, goto: 'key_breakdown' },
        ],
      },
      key_breakdown: {
        situation:
          'There it is: 40% of ALL requests are for the features of ~200 sale items (the doorbusters) plus ONE viral creator\'s storefront. ' +
          'These hot keys expire from cache every 30s (standard TTL), and each expiry triggers a THUNDERING HERD — thousands of concurrent misses hammer the backing store for the same key. The tail is the herd.',
        actions: [
          { text: 'Enable request coalescing (single-flight): one fetch per expired key, everyone else waits on it', costMin: 10, goto: 'coalesce' },
          { text: 'Pin hot keys: extend TTL to 10min for the top-500 keys during the sale', costMin: 8, goto: 'pin_ttl' },
          { text: 'Rate-limit requests to the hot keys at the gateway', costMin: 8, goto: 'rate_limit', tone: 'trap' },
        ],
      },
      rate_limit: {
        situation:
          'Rate limit live. Backing-store load drops — because you\'re now REJECTING feature lookups for the sale\'s best-selling items. ' +
          'Ranking falls back to popularity for exactly the products the sale is about. Merch team escalates: doorbuster conversion is cratering.',
        actions: [
          { text: 'Remove the limit; enable request coalescing instead', costMin: 10, goto: 'coalesce_late' },
        ],
      },
      pin_ttl: {
        situation:
          'Hot keys pinned for 10 minutes. Hit rate recovers to 88%, P99 falls to 240ms. Better — but sale features REPRICE every 2 minutes (flash pricing), ' +
          'and pinned features are now stale: some items show pre-drop prices in ranking features. Pricing team notices within minutes.',
        actions: [
          { text: 'Keep the pin, add request coalescing, then drop TTL back to 60s — coalescing carries the herd', costMin: 10, goto: 'end_resolved_pin' },
          { text: 'Accept staleness for the sale window — revenue over freshness', costMin: 5, goto: 'end_stale' },
        ],
      },
      coalesce: {
        situation:
          'Single-flight coalescing deploys. Each hot-key expiry now costs ONE backing-store fetch instead of thousands. ' +
          'Hit rate: 61% → 90%. P99: 1400ms → 180ms. Almost there — the last 30ms is the doorbuster keys\' fetch itself (they\'re heavy composite features).',
        actions: [
          { text: 'Add a 60s soft-TTL refresh-ahead for the top-500 keys (serve stale-while-revalidate)', costMin: 8, goto: 'end_resolved' },
          { text: 'Ship it — 180ms is close enough to the 150ms SLO during a 3x spike', costMin: 3, goto: 'end_close' },
        ],
      },
      coalesce_late: {
        situation:
          'Coalescing live. Hit rate 87%, P99 210ms and falling. The rate-limit detour cost conversion during eight peak minutes, but the system is stabilizing.',
        actions: [
          { text: 'Add refresh-ahead for the top-500 keys to finish the job', costMin: 8, goto: 'end_late' },
        ],
      },
      end_resolved: { outcome: 'resolved',
        debrief:
          'Root cause: cache stampede on ~200 hot keys — every TTL expiry triggered thousands of concurrent identical fetches. Neither capacity nor corruption: a CONCURRENCY pattern. ' +
          'Winning read: P99 melting while P50 was mild + falling hit rate = tail concentrated in specific keys; the key-level breakdown was the 5-minute action that explained everything. ' +
          'Fix stack: single-flight coalescing (herd → 1 fetch) + refresh-ahead (hot keys never cold). ' +
          'Traps avoided: cache restart (self-inflicted 100% miss storm), scaling (CPU was at 71% — you can\'t buy your way out of a stampede), rate-limiting your own bestsellers. ' +
          'Standing lesson: hot-key protection (coalescing + stale-while-revalidate) belongs in the feature-store client BEFORE the sale, not during it.' },
      end_resolved_pin: { outcome: 'resolved',
        debrief:
          'Solid: the pin bought immediate relief, coalescing fixed the mechanism, and dropping TTL back restored pricing freshness. ' +
          'One refinement: pin-first risked the staleness incident you then had to walk back — coalescing-first avoids ever serving stale prices. Same destination, slightly rockier road.' },
      end_close: { outcome: 'mitigated',
        debrief:
          'Coalescing was the right fix and 180ms during a 3.2x spike is defensible — but "close enough to SLO" left revenue on the table: the refresh-ahead step costs 8 minutes and removes the remaining tail entirely. ' +
          'Postmortem line: correct diagnosis, stopped one step short of done.' },
      end_stale: { outcome: 'mitigated',
        debrief:
          'You traded correctness for latency: rankings served pre-drop prices for pinned items during a FLASH-PRICING sale. Latency SLO met; pricing integrity broken — a different team\'s sev-2. ' +
          'The coalescing path gets both. When a fix creates a new incident for someone else, it\'s not a fix; it\'s a transfer.' },
      end_late: { outcome: 'mitigated',
        debrief:
          'System stabilized — after the rate-limit detour throttled your own doorbusters during peak minutes. The limit "worked" by rejecting the exact traffic the sale existed for. ' +
          'Rate limiting protects a backend from abuse; a stampede of LEGITIMATE demand needs coalescing, not rejection. Know which one you\'re in before you reach for the limiter.' },
    },
  },
]

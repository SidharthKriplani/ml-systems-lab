import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    title: 'Machine Learning Engineer',
    pathId: 'production_ml',
    icon: '⚙️',
    level: 'Core',
    accentColor: 'var(--mint)',
    borderColor: 'rgba(52,211,153,0.25)',
    bgColor: 'rgba(52,211,153,0.04)',
    demand: 'Very High',
    salaryUS: '$170k – $500k TC',
    salaryUK: '£80k – £200k',
    salaryDE: '€70k – €160k',
    focus: 'Production ML systems — feature pipelines, model serving, monitoring, retraining.',
    skills: ['Python', 'Spark/SQL', 'sklearn/PyTorch', 'Docker/K8s', 'Feature stores', 'A/B testing'],
    dayInLife: 'Debug a model performance regression, review a junior\'s feature pipeline PR, design a shadow evaluation for an upcoming model swap, join a cross-team meeting about data freshness SLAs.',
    hires: ['Meta', 'Spotify', 'Airbnb', 'Uber', 'Stripe', 'Databricks'],
  },
  {
    title: 'MLOps / ML Platform Engineer',
    pathId: 'mlops_track',
    icon: '🔧',
    level: 'Infra',
    accentColor: 'var(--sky)',
    borderColor: 'rgba(56,189,248,0.25)',
    bgColor: 'rgba(56,189,248,0.04)',
    demand: 'High',
    salaryUS: '$160k – $420k TC',
    salaryUK: '£75k – £180k',
    salaryDE: '€65k – €150k',
    focus: 'ML infrastructure — training pipelines, model registry, CI/CD for models, serving infrastructure.',
    skills: ['Kubernetes', 'Airflow/Prefect', 'MLflow/Weights & Biases', 'Terraform', 'Prometheus/Grafana', 'Ray'],
    dayInLife: 'Investigate a training pipeline failure, onboard a new team onto the model registry, prototype a GPU autoscaling policy, write runbooks for on-call scenarios.',
    hires: ['Google', 'Amazon', 'Netflix', 'LinkedIn', 'DoorDash', 'Lyft'],
  },
  {
    title: 'Research Scientist',
    pathId: 'staff_design',
    icon: '🔬',
    level: 'Research',
    accentColor: 'var(--violet)',
    borderColor: 'rgba(168,85,247,0.25)',
    bgColor: 'rgba(168,85,247,0.04)',
    demand: 'Moderate',
    salaryUS: '$200k – $700k TC',
    salaryUK: '£90k – £250k',
    salaryDE: '€80k – €180k',
    focus: 'Novel ML algorithms, architecture research, published papers, advancing field-level knowledge.',
    skills: ['Deep learning theory', 'JAX/PyTorch', 'Experiment design', 'LaTeX', 'Statistics', 'PhD research background'],
    dayInLife: 'Run ablation experiments on a new attention mechanism, read 5 papers, write up findings for a team sync, iterate on a draft for arXiv submission.',
    hires: ['DeepMind', 'OpenAI', 'Anthropic', 'Meta FAIR', 'Microsoft Research', 'Apple MLR'],
  },
  {
    title: 'Applied Scientist',
    pathId: 'mle_interview',
    icon: '🧪',
    level: 'Applied Research',
    accentColor: 'var(--ember)',
    borderColor: 'rgba(249,115,22,0.25)',
    bgColor: 'rgba(249,115,22,0.04)',
    demand: 'High',
    salaryUS: '$180k – $550k TC',
    salaryUK: '£85k – £220k',
    salaryDE: '€75k – €170k',
    focus: 'Bridge between research and product — novel techniques applied to real business problems. Amazon/Meta title.',
    skills: ['Advanced ML theory', 'Python', 'Statistical modelling', 'Experimental design', 'Causal inference'],
    dayInLife: 'Design an experiment to test a novel ranking approach, present findings to product leadership, collaborate with MLE to productionise a model prototype.',
    hires: ['Amazon', 'Meta', 'Netflix', 'Microsoft', 'Adobe', 'Walmart'],
  },
  {
    title: 'Data Scientist',
    pathId: 'ds_track',
    icon: '📊',
    level: 'Analytics',
    accentColor: 'var(--gold)',
    borderColor: 'rgba(251,191,36,0.25)',
    bgColor: 'rgba(251,191,36,0.04)',
    demand: 'High',
    salaryUS: '$120k – $280k TC',
    salaryUK: '£55k – £130k',
    salaryDE: '€50k – €120k',
    focus: 'Business analytics, model building, A/B test design, statistical analysis, reporting to stakeholders.',
    skills: ['Python/R', 'SQL', 'Statistics', 'Tableau/Looker', 'A/B testing', 'Business storytelling'],
    dayInLife: 'Analyse last week\'s A/B test, build a churn prediction model, present findings to the product team, write a data quality investigation for a metric anomaly.',
    hires: ['Airbnb', 'Booking.com', 'Twitter/X', 'Zalando', 'N26', 'Revolut'],
  },
  {
    title: 'NLP / Vision Specialist',
    pathId: 'deep_learning_prod',
    icon: '👁',
    level: 'Specialist',
    accentColor: 'var(--rose)',
    borderColor: 'rgba(244,63,94,0.25)',
    bgColor: 'rgba(244,63,94,0.04)',
    demand: 'Very High',
    salaryUS: '$200k – $600k TC',
    salaryUK: '£100k – £250k',
    salaryDE: '€90k – €200k',
    focus: 'Domain-specific deep learning — language models, computer vision, speech, multimodal systems.',
    skills: ['Transformers', 'HuggingFace', 'Fine-tuning LLMs', 'RLHF', 'Computer vision pipelines', 'PyTorch'],
    dayInLife: 'Evaluate a fine-tuned LLM on internal benchmarks, investigate a hallucination failure mode, prototype a retrieval-augmented generation system, review recent arXiv papers.',
    hires: ['Cohere', 'Mistral', 'Stability AI', 'Waymo', 'Tesla AI', 'Scale AI'],
  },
]

const SALARY_LEVELS = [
  { level: 'L3 / Junior', yoe: '0–2 yrs', us: { base: 155, tc: 210 }, uk: { base: 60, tc: 65 }, de: { base: 62, tc: 65 }, india: { base: 16, tc: 17 } },
  { level: 'L4 / Mid',    yoe: '2–5 yrs', us: { base: 190, tc: 290 }, uk: { base: 90, tc: 95 }, de: { base: 82, tc: 87 }, india: { base: 30, tc: 32 } },
  { level: 'L5 / Senior', yoe: '5–9 yrs', us: { base: 240, tc: 400 }, uk: { base: 130, tc: 140 }, de: { base: 115, tc: 122 }, india: { base: 70, tc: 75 } },
  { level: 'L6 / Staff',  yoe: '9–15 yrs',us: { base: 285, tc: 570 }, uk: { base: 180, tc: 195 }, de: { base: 155, tc: 165 }, india: { base: 110, tc: 118 } },
  { level: 'L7 / Principal',yoe:'15+ yrs', us: { base: 330, tc: 900 }, uk: { base: 240, tc: 265 }, de: { base: 200, tc: 215 }, india: { base: 170, tc: 185 } },
]

const STAGES = [
  {
    stage: 'Seed / Pre-seed',
    size: '1–5 engineers',
    bgColor: 'rgba(52,211,153,0.04)',
    borderColor: 'rgba(240,165,0,0.18)',
    accentColor: 'var(--mint)',
    stack: [
      { cat: 'Experimentation',  tools: ['Jupyter', 'pandas', 'scikit-learn', 'Matplotlib'] },
      { cat: 'Training',         tools: ['Local GPU / Colab', 'pickle', 'manual logging'] },
      { cat: 'Serving',          tools: ['FastAPI', 'Flask', 'Heroku / Render'] },
      { cat: 'Data',             tools: ['Postgres', 'CSV', 'S3 buckets'] },
      { cat: 'Monitoring',       tools: ['CloudWatch / Datadog basic', 'manual checks'] },
    ],
    philosophy: 'Prove the idea exists. Ship a prediction to a user. Every minute spent on infrastructure is a minute not spent finding product-market fit.',
    antipattern: 'Building MLflow + Kubeflow + a feature store before shipping a single prediction.',
  },
  {
    stage: 'Series A / B',
    size: '3–10 ML engineers',
    bgColor: 'rgba(56,189,248,0.04)',
    borderColor: 'rgba(56,189,248,0.2)',
    accentColor: 'var(--sky)',
    stack: [
      { cat: 'Experimentation',  tools: ['Jupyter', 'MLflow / W&B', 'DVC'] },
      { cat: 'Training',         tools: ['SageMaker / Vertex AI', 'Docker', 'Spot instances'] },
      { cat: 'Serving',          tools: ['SageMaker Endpoints', 'BentoML', 'FastAPI + K8s'] },
      { cat: 'Data',             tools: ['Snowflake / Redshift', 'dbt', 'Airflow / Prefect'] },
      { cat: 'Monitoring',       tools: ['Evidently / WhyLabs', 'custom dashboards'] },
    ],
    philosophy: 'Reproducibility is now a cost. You have 5+ engineers reproducing each other\'s work. Containerise, version, track everything.',
    antipattern: 'Manually retraining models. Not having shadow mode before every production promotion.',
  },
  {
    stage: 'Series C / Growth',
    size: '10–40 ML engineers',
    bgColor: 'rgba(168,85,247,0.04)',
    borderColor: 'rgba(168,85,247,0.2)',
    accentColor: 'var(--violet)',
    stack: [
      { cat: 'Experimentation',  tools: ['Weights & Biases', 'internal experiment platform'] },
      { cat: 'Training',         tools: ['Ray / Kubeflow', 'Metaflow', 'dedicated GPU cluster'] },
      { cat: 'Feature Store',    tools: ['Feast / Tecton / Hopsworks', 'Redis online store'] },
      { cat: 'Model Registry',   tools: ['MLflow Registry', 'custom model registry'] },
      { cat: 'Serving',          tools: ['Triton Inference Server', 'custom serving layer'] },
      { cat: 'Monitoring',       tools: ['Grafana + Prometheus', 'custom drift dashboards'] },
    ],
    philosophy: 'Platform investment now pays off. Every hour your MLEs spend managing ad-hoc infrastructure is an hour not on model quality.',
    antipattern: 'Building custom tooling for solved problems. Evaluate managed services before building.',
  },
  {
    stage: 'FAANG / Hyperscaler',
    size: '100+ ML engineers',
    bgColor: 'rgba(249,115,22,0.04)',
    borderColor: 'rgba(249,115,22,0.2)',
    accentColor: 'var(--ember)',
    stack: [
      { cat: 'Training',         tools: ['Custom training infra', 'TFX / FBLearner / SageMaker'] },
      { cat: 'Features',         tools: ['Custom feature store (Feast-inspired)', 'stream + batch'] },
      { cat: 'Serving',          tools: ['Custom serving systems (100k+ QPS)', 'edge inference'] },
      { cat: 'Experimentation',  tools: ['Custom A/B platform', 'interleaving experiments'] },
      { cat: 'Monitoring',       tools: ['Custom ML observability', 'automated rollback'] },
      { cat: 'Compliance',       tools: ['Model cards', 'audit trails', 'explainability tooling'] },
    ],
    philosophy: 'Off-the-shelf tools break at this scale. Custom infrastructure is maintained by dedicated platform teams. ML regulatory compliance is an engineering discipline.',
    antipattern: 'Outsourcing platform decisions to junior engineers. Missing lineage tracking for regulatory audit.',
  },
]

const COMPANIES = [
  {
    name: 'Netflix',
    icon: '🎬',
    sector: 'Streaming',
    mlMotto: '"Every second of content you\'ve watched was predicted."',
    headline: 'ML is Netflix\'s core product, not a feature.',
    teamSize: '~400 ML/Data scientists',
    mlBudget: 'Estimated $500M+/yr on personalisation alone',
    keyMLSystems: [
      { name: 'Recommendation Engine', impact: 'Drives 80% of content consumed. Home screen row ordering, thumbnail personalisation, search ranking.' },
      { name: 'Content Acquisition ML', impact: 'Predicts viewership and subscriber value of prospective original content before commissioning.' },
      { name: 'Encoding Optimisation', impact: 'Per-title, per-scene bitrate allocation — saves an estimated $1B+/yr in CDN costs.' },
      { name: 'Demand Forecasting', impact: 'Predicts streaming load patterns, drives infrastructure pre-scaling decisions.' },
    ],
    techHighlights: ['Two-tower retrieval', 'HNSW approximate nearest neighbour', 'Metaflow (open-sourced)', 'Per-user thumbnail A/B testing at scale'],
    insight: 'Netflix\'s personalisation insight: the row label is a product decision. "Because you watched Breaking Bad" is ML-generated and A/B tested. Even the order of rows on your homepage is a ranked list personalised to you.',
  },
  {
    name: 'Spotify',
    icon: '🎵',
    sector: 'Music Streaming',
    mlMotto: '"Every Monday morning, 456 million people get a playlist made just for them."',
    headline: 'Discovery is the product. ML is how discovery works.',
    teamSize: '~300 ML/Data scientists',
    mlBudget: 'N/A (private)',
    keyMLSystems: [
      { name: 'Discover Weekly', impact: '30-song playlist, generated weekly, individually personalised for 456M users. Launched 2015. Remains the most-cited recommendation product in industry.' },
      { name: 'Radio & Autoplay', impact: 'Keeps users in the app after a playlist ends. Collaborative filtering + audio feature similarity.' },
      { name: 'Podcast Recommendations', impact: 'Different signal (listens vs plays) from music. Separate model family with content embeddings.' },
      { name: 'Advertising ML', impact: 'Audience targeting, ad insertion timing, podcast ad effectiveness measurement.' },
    ],
    techHighlights: ['Graph neural networks for artist/track relationships', 'Audio CNNs for cold-start embeddings', 'Bandits for exploration', 'NLP for podcast content understanding'],
    insight: 'Spotify\'s cold-start solution is elegant: when a track has no listening history, embed it from its audio signal using a CNN trained on spectrograms. New artists get real recommendations immediately, not just popularity-based fallback.',
  },
  {
    name: 'Uber',
    icon: '🚗',
    sector: 'Ride-sharing / Logistics',
    mlMotto: '"Every price, every ETA, every match — ML."',
    headline: 'Real-time marketplace optimisation at planetary scale.',
    teamSize: '~500 ML/Data scientists',
    mlBudget: 'N/A (public, not disclosed)',
    keyMLSystems: [
      { name: 'Surge Pricing (uSurge)', impact: 'Dynamic pricing that balances supply and demand in real-time across 10,000+ cities. Geospatial ML on hexagonal grids.' },
      { name: 'ETA Prediction', impact: 'Estimated time of arrival is a ML regression problem with geospatial, time-series, and traffic features. Accuracy directly affects booking conversion.' },
      { name: 'Fraud Detection', impact: 'Detects fake accounts, payment fraud, and driver/rider cheating in real-time. Sub-100ms latency requirement.' },
      { name: 'Marketplace Matching', impact: 'Assigns riders to drivers optimising for multiple objectives: wait time, driver utilisation, carbon footprint.' },
    ],
    techHighlights: ['Michelangelo (internal ML platform)', 'Hexagonal spatial indexing (H3)', 'Real-time feature computation at sub-second latency', 'Causal ML for price elasticity estimation'],
    insight: 'Uber built Michelangelo — their internal ML platform — because they needed real-time feature computation at millisecond latency with automatic failover. No available tool in 2016 could do this. They open-sourced parts of it and it influenced SageMaker\'s design.',
  },
  {
    name: 'Airbnb',
    icon: '🏠',
    sector: 'Marketplace',
    mlMotto: '"Every price, every search ranking, every trust decision."',
    headline: 'Trust and discovery are ML problems. Solving them is Airbnb\'s business.',
    teamSize: '~200 ML engineers + data scientists',
    mlBudget: 'N/A',
    keyMLSystems: [
      { name: 'Search Ranking', impact: 'Core product. Ranks 7M+ listings for every search. Personalised by user preferences, trip type, prior history.' },
      { name: 'Smart Pricing', impact: 'Suggests optimal nightly prices to hosts based on local demand, seasonality, and comparable listings.' },
      { name: 'Trust & Safety', impact: 'Detects fraudulent listings, risky bookings, and policy violations. Both ML classifiers and human review workflows.' },
      { name: 'Review Summarisation', impact: 'LLM-powered summarisation of guest reviews for faster listing evaluation.' },
    ],
    techHighlights: ['Bighead (internal ML platform, similar to Michelangelo)', 'Unified feature store across teams', 'Embedding-based listing similarity', 'LLM integration for review understanding'],
    insight: 'Airbnb\'s most underappreciated ML investment is in host-side pricing. Hosts who use Smart Pricing earn an estimated 13% more than comparable hosts who don\'t. This ML system doesn\'t just help Airbnb — it directly increases host income, which increases supply quality, which increases guest satisfaction. Virtuous cycle design.',
  },
  {
    name: 'Google',
    icon: '🔍',
    sector: 'Search / Ads / Cloud',
    mlMotto: '"ML is foundational, not a feature."',
    headline: 'Google is a machine learning company that also does search.',
    teamSize: '5,000+ ML engineers and researchers',
    mlBudget: '$30B+ annual compute investment (estimated)',
    keyMLSystems: [
      { name: 'Search (RankBrain → MUM → Gemini)', impact: 'Neural ranking replaced hand-tuned signals entirely. Now multimodal, understanding images and video in searches.' },
      { name: 'Ads (Smart Bidding)', impact: 'Automated bidding ML replaced manual CPC bidding for most advertisers. Accounts for $200B+ annual revenue.' },
      { name: 'Google Translate', impact: 'Neural machine translation (2016) improved translation quality more than the previous 10 years of research.' },
      { name: 'DeepMind Systems', impact: 'AlphaFold solved protein structure prediction. AlphaCode demonstrates competitive programming. Gemini is competitive across all modalities.' },
    ],
    techHighlights: ['TPUs (custom ML accelerators)', 'TensorFlow / JAX', 'TFX (production ML pipelines)', 'Vertex AI (cloud ML platform)', 'Pathways (large-scale model training infrastructure)'],
    insight: 'Google\'s unique ML leverage: TPUs. A TPU v4 pod delivers roughly 1 exaFLOP of compute. Designing custom silicon for ML allows Google to train and serve models at cost structures competitors can\'t match. This hardware advantage underlies every Gemini capability comparison.',
  },
  {
    name: 'Meta',
    icon: '👥',
    sector: 'Social / VR',
    mlMotto: '"Every feed, every ad, every content moderation decision."',
    headline: 'Four billion users generate the world\'s largest labelled social graph.',
    teamSize: '5,000+ ML engineers and researchers',
    mlBudget: '$35B+ capex (2024), majority ML infrastructure',
    keyMLSystems: [
      { name: 'Feed Ranking', impact: 'Decides what 3B+ users see every time they open Facebook or Instagram. Optimises for engagement while applying integrity filters.' },
      { name: 'Ads Targeting', impact: '~98% of Meta\'s $130B+ annual revenue. Predicts conversion probability for billions of user-ad pairs per day.' },
      { name: 'Content Moderation', impact: 'Automated detection of harmful content at scale no human review team could match. 99% of detected terrorism content removed before any user reports it.' },
      { name: 'Llama / FAIR Research', impact: 'Meta open-sources its foundation models (Llama 2, Llama 3). FAIR produces research that influences the entire field.' },
    ],
    techHighlights: ['FBLearner Flow (training platform)', 'Faiss (open-source ANN library)', 'PyTorch (open-sourced from internal Torch)', 'Llama family of open models', 'Custom MTIA inference chips'],
    insight: 'Meta\'s decision to open-source PyTorch and Llama is strategic, not altruistic. By making the dominant research framework free (PyTorch), Meta shaped how an entire generation of ML engineers think. By releasing Llama, Meta positioned itself as the open alternative to OpenAI and Google, which helps with talent recruitment, enterprise sales, and regulatory perception simultaneously.',
  },
]

const TIMELINE = [
  { year: '2012', title: 'AlexNet', color: 'var(--mint)', desc: 'Deep learning wins ImageNet by a 10-point margin. The field pivots. GPU training becomes the new normal.' },
  { year: '2014', title: 'GANs + DeepFace', color: 'var(--sky)', desc: 'Goodfellow invents GANs in a bar. Meta\'s DeepFace achieves near-human face recognition accuracy. Deep learning goes commercial.' },
  { year: '2015', title: 'ResNet + TensorFlow', color: 'var(--mint)', desc: 'ResNet enables 152-layer networks with skip connections. Google open-sources TensorFlow, democratising deep learning implementation.' },
  { year: '2016', title: 'AlphaGo + PyTorch', color: 'var(--sky)', desc: 'AlphaGo beats Lee Sedol 4–1. Facebook releases PyTorch. The RL + deep learning combination becomes industrially viable.' },
  { year: '2017', title: '"Attention Is All You Need"', color: 'var(--violet)', desc: 'The Transformer architecture replaces RNNs for sequence modelling. The paper that triggers everything that follows.' },
  { year: '2018', title: 'BERT + GPT-1', color: 'var(--violet)', desc: 'Pre-training on large corpora + fine-tuning on tasks replaces every previous NLP approach simultaneously. Transfer learning arrives for text.' },
  { year: '2020', title: 'GPT-3 + Scaling Laws', color: 'var(--ember)', desc: 'GPT-3 demonstrates emergent few-shot learning. The scaling laws paper quantifies the compute-capability relationship. "Just scale it" becomes a research strategy.' },
  { year: '2021', title: 'GitHub Copilot', color: 'var(--ember)', desc: 'First mass-market ML product that changes how a professional skill is practised. 40% of Copilot-generated code is accepted. Code generation is real.' },
  { year: '2022', title: 'ChatGPT + Diffusion', color: 'var(--rose)', desc: 'ChatGPT reaches 100M users in 60 days. Stable Diffusion, DALL-E 2, and Midjourney cross the quality threshold for image generation. Consumer AI begins.' },
  { year: '2023', title: 'GPT-4 + Open Models', color: 'var(--rose)', desc: 'GPT-4 sets a new capability bar. Meta releases Llama, triggering an open-source LLM ecosystem. Enterprise AI adoption reaches escape velocity.' },
  { year: '2024', title: 'Reasoning + Agents', color: 'var(--gold)', desc: 'o1 introduces chain-of-thought at inference time. Agent frameworks (LangChain, AutoGen, Claude agents) enable multi-step task execution. Multimodal becomes standard.' },
  { year: '2025', title: 'Production AI', color: 'var(--gold)', desc: 'The question shifts from "can it work?" to "can we deploy it reliably and cheaply?". Inference efficiency, RAG systems, and ML ops mature. AI regulation goes live in the EU.' },
]

const MARKETS = [
  { country: 'United States', flag: '🇺🇸', hubs: 'San Francisco, Seattle, New York, Austin', seniors: '$320k–500k TC', gradient: 'linear-gradient(135deg, rgba(240,165,0,0.18), rgba(52,211,153,0.05))', border: 'rgba(52,211,153,0.30)', strengths: 'Highest compensation globally. World-class equity culture. Deepest talent networks. Best access to cutting-edge research.', watch: 'H-1B visa lottery. Very high cost of living in major hubs. Working culture intensity.' },
  { country: 'United Kingdom', flag: '🇬🇧', hubs: 'London, Edinburgh, Cambridge', seniors: '£120k–180k base', gradient: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(56,189,248,0.05))', border: 'rgba(56,189,248,0.3)', strengths: 'Strong equity via Global Talent Visa. DeepMind, Stability AI heritage. Excellent work-life balance. Strong academic pipeline.', watch: 'Equity culture weaker than US. High income tax (45% top bracket). Post-Brexit talent friction.' },
  { country: 'Germany', flag: '🇩🇪', hubs: 'Berlin, Munich, Hamburg', seniors: '€120k–160k base', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))', border: 'rgba(168,85,247,0.3)', strengths: 'EU AI Act expertise becoming premium skillset. Strong research institutions. Excellent engineering culture. Growing startup scene.', watch: 'High tax burden (42%+ effective). Lower equity culture. Language can be a barrier outside tech companies.' },
  { country: 'Canada', flag: '🇨🇦', hubs: 'Toronto, Montreal, Vancouver', seniors: 'CAD $170k–220k base', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))', border: 'rgba(249,115,22,0.3)', strengths: 'Hinton (Toronto), Bengio (Montreal) academic lineage. Strong immigration pathways. Good quality of life. US company outposts.', watch: 'CAD currency discount (~27%). Cold winters. Most top companies are US offices, limiting equity upside.' },
  { country: 'India', flag: '🇮🇳', hubs: 'Bangalore, Hyderabad, Chennai', seniors: '₹60L–120L ($72k–145k)', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', border: 'rgba(251,191,36,0.3)', strengths: 'Rapidly growing compensation at top tier. Massive talent pool from IITs/IISc. Global company offices accelerating. PPP-adjusted salaries competitive.', watch: 'Absolute numbers still lower than Western markets. Varies enormously by company tier. Visa required for most Western opportunities.' },
  { country: 'Singapore', flag: '🇸🇬', hubs: 'Singapore city', seniors: 'SGD $180k–250k ($133k–185k)', gradient: 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(244,63,94,0.05))', border: 'rgba(244,63,94,0.3)', strengths: 'Low income tax (22% top bracket). APAC hub for Google, Meta, ByteDance. Gateway between India and East Asia talent pools. English-speaking.', watch: 'Small market. Equity culture weaker than US. Very high cost of living. Limited local startup ecosystem.' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function RolesSection({ onNavigate }) {
  const [selected, setSelected] = useState(null)
  const role = selected !== null ? ROLES[selected] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div className="eyebrow">6 core ML roles</div>
        <h2 className="section-title">Roles & Day-to-Day Reality</h2>
        <p className="section-sub">What these roles actually involve, who hires for them, and what the compensation looks like across geographies.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
        {ROLES.map((r, i) => (
          <button key={r.title} onClick={() => setSelected(selected === i ? null : i)}
            style={{ textAlign: 'left', padding: '18px 20px', borderRadius: '12px', border: `1px solid ${selected === i ? r.borderColor : 'var(--rim)'}`, background: selected === i ? r.bgColor : 'var(--depth)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '22px' }}>{r.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: selected === i ? r.accentColor : 'var(--ink-hi)' }}>{r.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{r.level}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: r.bgColor, color: r.accentColor, border: `1px solid ${r.borderColor}`, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{r.demand}</div>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{r.focus}</p>
          </button>
        ))}
      </div>

      {role && (
        <div className="card" style={{ border: `1px solid ${role.borderColor}`, background: role.bgColor, padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '28px' }}>{role.icon}</span>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, color: role.accentColor, margin: 0 }}>{role.title}</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {[['🇺🇸 US TC', role.salaryUS], ['🇬🇧 UK Base', role.salaryUK], ['🇩🇪 DE Base', role.salaryDE]].map(([label, val]) => (
              <div key={label} style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--rim)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>A Tuesday afternoon</div>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>{role.dayInLife}</p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Core skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {role.skills.map(s => (
                <span key={s} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--rim)', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>{s}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Who hires for this</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {role.hires.map(h => (
                <span key={h} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', background: role.bgColor, border: `1px solid ${role.borderColor}`, color: role.accentColor, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{h}</span>
              ))}
            </div>
          </div>

          {role.pathId && onNavigate && (
            <button
              onClick={() => {
                localStorage.setItem('msl_goto_path', role.pathId)
                onNavigate('home')
              }}
              style={{ fontSize: '13px', padding: '10px 20px', background: role.bgColor, border: `1px solid ${role.borderColor}`, borderRadius: '8px', color: role.accentColor, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Start this learning path →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SalarySection() {
  const [region, setRegion] = useState('us')
  const maxTC = Math.max(...SALARY_LEVELS.map(l => l[region]?.tc ?? 0))

  const REGIONS = [
    { id: 'us', label: '🇺🇸 US (USD)', currency: 'k' },
    { id: 'uk', label: '🇬🇧 UK (GBP)', currency: 'k' },
    { id: 'de', label: '🇩🇪 DE (EUR)', currency: 'k' },
    { id: 'india', label: '🇮🇳 India (USD)', currency: 'k' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div className="eyebrow">Compensation by level</div>
        <h2 className="section-title">Salary Explorer</h2>
        <p className="section-sub">Total compensation (base + equity + bonus) across levels and geographies. Data represents 2025 ranges at tier-1 tech companies. US figures include typical RSU grants.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {REGIONS.map(r => (
          <button key={r.id} onClick={() => setRegion(r.id)} className={`sub-tab ${region === r.id ? 'active' : 'inactive'}`} style={{ fontSize: '13px' }}>
            {r.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SALARY_LEVELS.map(l => {
          const d = l[region]
          if (!d) return null
          const tcPct = (d.tc / maxTC) * 100
          const basePct = (d.base / maxTC) * 100
          return (
            <div key={l.level} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', marginRight: '10px' }}>{l.level}</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{l.yoe}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--ink-low)' }}>Base: <span style={{ color: 'var(--ink-mid)' }}>{d.base}k</span></span>
                  <span style={{ color: 'var(--mint)', fontWeight: 700 }}>TC: {d.tc}k</span>
                </div>
              </div>
              <div style={{ position: 'relative', height: '20px', background: 'var(--rim)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${tcPct}%`, background: 'rgba(240,165,0,0.18)', borderRadius: '4px', transition: 'width 0.4s' }} />
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${basePct}%`, background: 'var(--mint)', borderRadius: '4px', transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px', color: 'var(--ink-ghost)' }}>
                <span style={{ color: 'var(--mint)' }}>■ Base</span>
                <span style={{ color: 'rgba(240,165,0,0.35)' }}>■ Equity + Bonus</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ padding: '16px 20px', background: 'rgba(52,211,153,0.04)', borderColor: 'rgba(240,165,0,0.18)' }}>
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.75 }}>
          <strong style={{ color: 'var(--mint)' }}>Reading this chart:</strong> The mint bar is base salary. The full bar (light green) includes equity (RSUs) and bonus. At senior US levels, equity can be 2–3× base. UK/EU equity culture is weaker — most of the bar is base.
          At FAANG, annual refresh grants (new equity each year) compound significantly over a multi-year tenure — not shown here.
        </div>
      </div>
    </div>
  )
}

function StackSection() {
  const [stage, setStage] = useState(0)
  const s = STAGES[stage]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div className="eyebrow">By company stage</div>
        <h2 className="section-title">The Real ML Stack</h2>
        <p className="section-sub">What tools and infrastructure actually get used — at each stage of a company's growth. The right stack is the one that matches your current scale.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {STAGES.map((st, i) => (
          <button key={st.stage} onClick={() => setStage(i)} className={`sub-tab ${stage === i ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>
            {st.stage}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: s.accentColor, marginBottom: '4px' }}>{s.stage}</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>{s.size}</div>
          {s.stack.map(cat => (
            <div key={cat.cat} style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>{cat.cat}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cat.tools.map(t => (
                  <span key={t} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${s.borderColor}`, color: s.accentColor, fontFamily: 'var(--font-mono)' }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '16px 20px', borderColor: s.borderColor, background: s.bgColor }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Philosophy</div>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{s.philosophy}</p>
          </div>
          <div className="card" style={{ padding: '16px 20px', background: 'rgba(244,63,94,0.04)', borderColor: 'rgba(244,63,94,0.25)' }}>
            <div style={{ fontSize: '12px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>⚠ Anti-pattern at this stage</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>{s.antipattern}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompaniesSection() {
  const [selected, setSelected] = useState(0)
  const c = COMPANIES[selected]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div className="eyebrow">Case studies</div>
        <h2 className="section-title">How Top Companies Actually Use ML</h2>
        <p className="section-sub">The real ML systems, the business impact, and the engineering insights that don't make it into job postings.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {COMPANIES.map((co, i) => (
          <button key={co.name} onClick={() => setSelected(i)}
            className={`sub-tab ${selected === i ? 'active' : 'inactive'}`} style={{ fontSize: '13px' }}>
            {co.icon} {co.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '36px', lineHeight: 1 }}>{c.icon}</span>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: 'var(--ink-hi)', margin: '0 0 4px' }}>{c.name}</h3>
              <div style={{ fontSize: '13px', color: 'var(--mint)', fontStyle: 'italic', marginBottom: '8px' }}>{c.mlMotto}</div>
              <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{c.headline}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '12px 0', borderTop: '1px solid var(--rim)' }}>
            <span style={{ color: 'var(--ink-low)' }}>Team: <span style={{ color: 'var(--ink-mid)' }}>{c.teamSize}</span></span>
            {c.mlBudget !== 'N/A (private)' && c.mlBudget !== 'N/A' && <span style={{ color: 'var(--ink-low)' }}>Investment: <span style={{ color: 'var(--mint)' }}>{c.mlBudget}</span></span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {c.keyMLSystems.map(sys => (
            <div key={sys.name} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '6px' }}>{sys.name}</div>
              <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0 }}>{sys.impact}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Tech highlights</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {c.techHighlights.map(t => (
                <span key={t} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '5px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: 'var(--sky)', fontFamily: 'var(--font-mono)' }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', background: 'rgba(52,211,153,0.04)', borderColor: 'rgba(240,165,0,0.18)' }}>
            <div style={{ fontSize: '12px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Key insight</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>{c.insight}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div className="eyebrow">2012 → 2025</div>
        <h2 className="section-title">AlexNet to Agents: The ML Timeline</h2>
        <p className="section-sub">Twelve years that rewrote every assumption about what machines could do.</p>
      </div>

      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, var(--mint), var(--gold))' }} />
        {TIMELINE.map((e, i) => (
          <div key={e.year} style={{ position: 'relative', marginBottom: '28px', paddingLeft: '24px' }}>
            <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: e.color, border: '2px solid var(--depth)', boxShadow: `0 0 8px ${e.color}` }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: e.color, fontWeight: 700 }}>{e.year}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)' }}>{e.title}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>{e.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MarketsSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div className="eyebrow">6 major ML markets</div>
        <h2 className="section-title">Where in the World to Be an ML Engineer</h2>
        <p className="section-sub">Salary is one variable. Tax, cost of living, visa, work culture, and community shape what a city actually offers an ML career.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {MARKETS.map(m => (
          <div key={m.country} style={{ padding: '20px 22px', borderRadius: '12px', border: `1px solid ${m.border}`, background: m.gradient }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>{m.flag}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)' }}>{m.country}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{m.hubs}</div>
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--mint)' }}>
              Senior MLE: {m.seniors}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Strengths</div>
              <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0 }}>{m.strengths}</p>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--ember)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Watch</div>
              <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0 }}>{m.watch}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab shell ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'roles',     label: 'Roles',      icon: '👤', component: RolesSection },
  { id: 'salary',    label: 'Salaries',   icon: '💰', component: SalarySection },
  { id: 'stacks',    label: 'Tech Stacks',icon: '🔩', component: StackSection },
  { id: 'companies', label: 'Companies',  icon: '🏢', component: CompaniesSection },
  { id: 'timeline',  label: 'ML History', icon: '📅', component: TimelineSection },
  { id: 'markets',   label: 'Global',     icon: '🌍', component: MarketsSection },
]

export default function LandscapeTab({ onNavigate }) {
  const [active, setActive] = useState('roles')
  const ActiveSection = SECTIONS.find(s => s.id === active)?.component ?? RolesSection

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Landscape</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '620px' }}>
          The full picture of ML as a career and industry — roles, salaries, tech stacks, how top companies use ML,
          the history that got us here, and where in the world the jobs are.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`sub-tab ${active === s.id ? 'active' : 'inactive'}`}>
            <span style={{ marginRight: '6px' }}>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      <ActiveSection onNavigate={active === 'roles' ? onNavigate : undefined} />
    </div>
  )
}

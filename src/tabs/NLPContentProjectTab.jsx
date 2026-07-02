import React from 'react'
import { ProjectLabSkeleton } from './ProjectLabSkeleton.jsx'

const SPEC = {
  kicker: 'Project Lab · NLP / Content',
  title: 'Content Understanding: Embed the Cold Catalog',
  subtitle: 'A content-science project — turn text (titles, descriptions, transcripts) into embeddings that bootstrap recommendations for brand-new items that have zero interactions.',
  archetype: 'NLP / content understanding for cold-start. The problem is evaluation without labels and blending content with collaborative signal — not model architecture.',
  why: 'Collaborative filtering is helpless on a day-one item with no clicks. This lab uses content — text embeddings from descriptions and transcripts — to place a new item in the same space as the catalog, then blends that content signal with collaborative signal as interactions arrive. It also confronts the honest hard part: how do you evaluate content quality when you have no ground-truth relevance labels?',
  phases: [
    { name: 'Text → embeddings', desc: 'Embed item metadata and transcript snippets (sentence-transformer style); inspect the space with nearest neighbors and sanity-check clusters.' },
    { name: 'Cold-start retrieval', desc: 'For a held-out "new" item with interactions hidden, retrieve neighbors from content alone and measure whether they’re plausible.' },
    { name: 'Content ⊕ collaborative blend', desc: 'Weight content vs collaborative signal as a function of how many interactions an item has — heavy content when cold, decaying as it warms.' },
    { name: 'Evaluation without labels', desc: 'Proxy metrics: category-coherence of neighbors, downstream CTR on a simulated slate, and human-style spot checks. Confront the label-scarcity honestly.' },
    { name: 'Quality & safety', desc: 'Guard against embedding-collapse, near-duplicate spam, and topic drift; decide what "good enough to serve cold" means.' },
  ],
  checkpoints: [
    'Why collaborative filtering fails cold-start, and precisely what content buys you on day one.',
    'Choosing an embedding: off-the-shelf sentence model vs fine-tuned — what evidence would justify the fine-tune cost?',
    'The content→collaborative handoff: at how many interactions do you start trusting behavior over text, and why?',
    'Evaluating with no relevance labels — which proxy metrics are trustworthy and which are self-fulfilling.',
    'A new item’s neighbors look topically right but nobody clicks — content quality problem or ranking/exposure problem?',
  ],
  datasetNote: 'Planned dataset: a catalog of item descriptions + short transcript excerpts with a held-out cold set, Pyodide-runnable with a lightweight embedding model.',
}

export function NLPContentProjectTab() {
  return <ProjectLabSkeleton spec={SPEC} />
}

export default NLPContentProjectTab

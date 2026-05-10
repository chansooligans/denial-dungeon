// Shared glossary used by the runtime puzzle's Dana's notebook.
//
// Standalone Case prototypes keep their own per-case glossaries (with
// case-specific entries like "LCD L33457" tied to that prototype's
// scenario). The runtime puzzle reuses a *shared* glossary because
// its briefings are static spec strings rather than authored markup —
// `wrapTerms` scans each briefing block at render time and wraps the
// first occurrence of any glossary term in a hover-tooltip span.
//
// Adding entries: append to GLOSSARY_ENTRIES below. Each entry's
// `match` field is the literal phrase as it appears in briefing
// prose; case-sensitive. List longer phrases before shorter ones if
// they share a prefix (e.g. "CO-197" before "CO-19") — the wrapper
// resolves overlap by sorting by length descending.

import { escape } from './prototype-base'

export interface GlossaryEntry {
  /** Literal phrase to match in briefing text (case-sensitive). */
  match: string
  /** Display name shown in the tooltip header (defaults to `match`). */
  term?: string
  /** One-or-two-sentence plain-English explanation. Becomes the
   *  `title=` attribute on the wrapped span; browsers render it as
   *  a native hover tooltip. */
  plain: string
}

/** Curated glossary — the terms that show up across the runtime
 *  puzzle briefings. Order doesn't matter; `wrapTerms` sorts by
 *  match-length descending to handle overlapping prefixes. */
export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // X12 transactions — the EDI standards payers and providers exchange.
  {
    match: 'X12 270/271',
    plain: 'The eligibility-check exchange. The provider sends a 270 ("is this patient covered?"); the payer responds with a 271 (member id, plan, copay, deductible). Mandated under HIPAA for electronic transactions.',
  },
  {
    match: '277CA',
    term: '277CA (claim acknowledgement)',
    plain: 'The "we received your claim and here\'s what\'s wrong with it" acknowledgement from the clearinghouse / payer. Each rejection inside has its own STC code with a specific reason.',
  },
  {
    match: '278',
    term: 'X12 278 (prior authorization)',
    plain: 'The EDI transaction for prior-auth requests + responses. Provider files a 278 to ask "will you cover this?" before the service; payer responds with approval, denial, or "needs more info."',
  },
  {
    match: '837',
    term: 'X12 837 (claim submission)',
    plain: 'The EDI transaction providers use to submit claims to payers. 837P is professional (CMS-1500); 837I is institutional (UB-04). Replaced paper claim submission for almost all electronic billing.',
  },
  {
    match: '835',
    term: 'X12 835 (electronic remittance)',
    plain: 'The "here\'s what we paid and why" response from payer to provider. Carries CARC/RARC codes explaining each adjustment, the paid amount, and the patient-responsibility split.',
  },
  {
    match: '270',
    term: 'X12 270 (eligibility inquiry)',
    plain: 'The "is this patient covered?" query, sent to the payer in real time before service. Returns a 271 response with member id, plan, effective dates, copay, deductible.',
  },
  {
    match: '271',
    term: 'X12 271 (eligibility response)',
    plain: 'The payer\'s response to a 270 eligibility query. Source of truth for member id, plan, copay, deductible — beats whatever\'s on the photocopy of the patient\'s insurance card.',
  },

  // Claim forms.
  {
    match: 'CMS-1500',
    plain: 'The standard professional claim form (doctors\' offices, outpatient providers). Numbered boxes — Box 1a is the subscriber id, Box 21 is diagnoses, Box 24 is service lines, Box 23 is the prior-auth number.',
  },
  {
    match: 'UB-04',
    plain: 'The standard institutional claim form (hospitals, SNFs, hospice, home health). Where 837P uses CMS-1500, 837I uses UB-04 — the institutional cousin with revenue codes and value codes.',
  },

  // CARC denial codes that show up across multiple briefings.
  {
    match: 'CO-197',
    term: 'CO-197 (precert/auth absent)',
    plain: 'Denial: prior authorization was required but not on file when the claim landed. Common fix: file a retroactive 278 request, get the auth number back, amend Box 23 of the CMS-1500.',
  },
  {
    match: 'CO-109',
    term: 'CO-109 (claim not covered by this payer)',
    plain: 'Denial: this isn\'t our patient. Usually means the wrong payer was billed (eligibility / coordination-of-benefits mismatch). Re-route to the actual payer or fix the COB order.',
  },
  {
    match: 'CO-29',
    term: 'CO-29 (timely-filing limit exceeded)',
    plain: 'Denial: claim was received past the payer\'s filing window (commonly 90 or 180 days from DOS). Defense: prove the original went out in time, usually via 277CA timestamps.',
  },
  {
    match: 'CO-31',
    term: 'CO-31 (patient not identified as our insured)',
    plain: 'Denial: demographics on the claim don\'t match the payer\'s member roster. Usually a wrong subscriber id, wrong patient name, or wrong card. Fix by amending Box 1a from the 271 response.',
  },
  {
    match: 'CO-50',
    term: 'CO-50 (not medically necessary)',
    plain: 'Denial: payer\'s medical-necessity criteria weren\'t met. Common in radiology, advanced imaging, surgery. Defense is a citation chain — chart fact + policy clause + payer assertion all addressing the same issue.',
  },
  {
    match: 'CO-97',
    term: 'CO-97 (bundled service)',
    plain: 'Denial: payer rolled this code into a primary service. Usual fix: prove the service was significant + separately identifiable AND apply the right modifier (most often 25 or 59).',
  },
  {
    match: 'CO-22',
    term: 'CO-22 (coordination of benefits)',
    plain: 'Denial: this isn\'t the primary payer. Patient has another coverage that should have been billed first. Fix by re-routing to the primary payer or running a fresh COB inquiry.',
  },
  {
    match: 'CO-18',
    term: 'CO-18 (exact duplicate)',
    plain: 'Denial: the payer\'s matching algorithm flagged this claim as identical to one already on file. Fix with a frequency-code-7 replacement that references the original ICN.',
  },
  {
    match: 'CO-16',
    term: 'CO-16 (claim/service lacks information)',
    plain: 'The catch-all denial. The CARC itself tells you almost nothing — read the RARC string + the 277CA detail to find the actual missing field. Eighteen on a Monday usually means a single root-cause break upstream.',
  },

  // Modifiers + coding doctrine.
  {
    match: 'modifier 25',
    plain: 'Significant, separately identifiable E&M service performed by the same physician on the same day as a procedure. Belongs on the E&M line, not the procedure. Most common modifier for breaking NCCI bundling.',
  },
  {
    match: 'modifier 59',
    plain: 'Distinct procedural service. Used when two procedures that are normally bundled are performed in different anatomic sites or sessions. CMS prefers the more specific X-modifiers (XE/XS/XP/XU) when they apply.',
  },
  {
    match: 'modifier KX',
    plain: 'Requirements specified in the medical policy have been met. Common in DME, PT therapy caps, and specific Medicare LCDs. Says: "I read the policy. I meet it. Pay it."',
  },
  {
    match: 'NCCI',
    term: 'NCCI (National Correct Coding Initiative)',
    plain: 'CMS\'s coding-edit tables that drive most CO-97 bundling denials. Each edit pair has an indicator — "1" means a modifier can break the bundle; "0" means it can\'t.',
  },
  {
    match: 'ICD-10-CM',
    plain: 'The diagnosis code set used in the US. Codes like I50.22 (chronic systolic heart failure) or J18.9 (pneumonia, unspecified). What goes in Box 21 of the CMS-1500.',
  },
  {
    match: 'CPT',
    term: 'CPT (Current Procedural Terminology)',
    plain: 'The procedure code set, owned + licensed by the AMA. What you bill — 99213 (office visit), 93306 (echocardiogram), 11402 (lesion excision). Goes in Box 24 of the CMS-1500.',
  },

  // Other doctrine.
  {
    match: 'LCD',
    term: 'LCD (Local Coverage Determination)',
    plain: 'A Medicare contractor\'s public policy spelling out exactly when they\'ll cover a service — diagnosis codes, frequency limits, documentation requirements. Real revenue-cycle analysts read these directly when fighting CO-50 denials.',
  },
  {
    match: 'CARC',
    term: 'CARC (Claim Adjustment Reason Code)',
    plain: 'The standard codes payers use to explain why a claim line wasn\'t paid in full (CO-50, CO-97, CO-31, etc.). Maintained by X12 + WPC; every CARC has a paired RARC for additional context.',
  },
  {
    match: 'RARC',
    term: 'RARC (Remittance Advice Remark Code)',
    plain: 'Companion code to CARC — the "more detail" string. CO-16 (lacks information) is meaningless without its RARC pointing at the specific missing field.',
  },
  {
    match: 'ICN',
    term: 'ICN (internal control number)',
    plain: 'The payer\'s unique id for a specific claim. Reference it on a frequency-7 replacement so the chain is unambiguous; reference it on appeals so you\'re not arguing about a different claim.',
  },
  {
    match: 'COB',
    term: 'COB (coordination of benefits)',
    plain: 'The rules for which insurance pays first when a patient has more than one. Birthday rule, employer-vs-retiree, Medicare secondary — every payer keeps its own COB record and they don\'t always agree.',
  },
  {
    match: 'CDI',
    term: 'CDI (clinical documentation improvement)',
    plain: 'A nurse or coder who reviews charts before claims drop and writes "queries" to physicians for clarification. Most upstream defense against CO-50 medical-necessity denials.',
  },
  {
    match: 'NSA',
    term: 'NSA (No Surprises Act)',
    plain: 'Federal law that caps patient cost-share to in-network levels for emergency + ancillary services at in-network facilities. Payer↔provider rate disputes route through IDR; the patient is out of the fight once cost-share is correctly calculated.',
  },
  {
    match: 'IDR',
    term: 'IDR (Independent Dispute Resolution)',
    plain: 'The arbitration process the NSA built for OON payment disputes. Baseball-style: each side submits a number; the arbitrator picks one. Patient is not a party.',
  },
  {
    match: 'subscriber ID',
    plain: 'The unique number a payer assigns to each member on a plan. Lives in Box 1a of the CMS-1500. Wrong subscriber id is the #1 cause of CO-31 ("patient not identified") denials.',
  },
  {
    match: 'frequency code',
    plain: 'A one-digit field on the 837 telling the payer whether the claim is original (0), replacement (7), or void (8). Replacement claims must reference the original ICN so the chain is unambiguous.',
  },
  {
    match: 'eligibility',
    plain: 'Whether a patient is currently covered by a given plan. Verified before service via a 270 inquiry; the 271 response carries the live answer (member id, plan, copay, deductible, effective dates).',
  },
  {
    match: 'prior auth',
    plain: 'Pre-service approval the payer requires before they\'ll cover certain services (advanced imaging, surgery, certain drugs). Filed via X12 278; the auth number lives in Box 23 of the CMS-1500.',
  },
  {
    match: 'medical necessity',
    plain: 'The doctrine that payers only cover services "reasonable and necessary" for the diagnosis. Defined in payer policies (LCDs for Medicare, medical-policy bulletins for commercial). The basis for CO-50 denials.',
  },
]

/** Build an index by match phrase for fast lookup. */
const GLOSSARY_BY_MATCH = new Map(GLOSSARY_ENTRIES.map(e => [e.match, e]))

/** Sorted match-phrase list, longest-first, so "CO-197" wraps before
 *  "CO-19" / "197" if a briefing happens to mention both. */
const SORTED_MATCHES = [...GLOSSARY_ENTRIES.map(e => e.match)]
  .sort((a, b) => b.length - a.length)

/**
 * Walk an HTML string and wrap the first occurrence of any glossary
 * term inside *text content* (not inside existing tags). Multiple
 * calls share a `wrappedSet` so a term wrapped in paragraph 1
 * doesn't get re-wrapped in paragraph 2.
 *
 * Why first-occurrence-only: peppering every "modifier 25" mention
 * across a briefing with question-mark icons reads as noise. The
 * player learns the term once on its first appearance; subsequent
 * mentions read clean.
 *
 * Tag-aware: angle-bracket content is preserved verbatim, so we
 * never wrap inside an attribute (e.g. `data-action="..."`) or
 * inside an existing span.
 */
export function wrapTerms(html: string, wrappedSet: Set<string>): string {
  // Tokenize html into [tagOrText, ...] segments. Walk in order.
  const out: string[] = []
  let i = 0
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i)
      if (end === -1) {
        out.push(html.slice(i))
        break
      }
      out.push(html.slice(i, end + 1))
      i = end + 1
    } else {
      const next = html.indexOf('<', i)
      const text = next === -1 ? html.slice(i) : html.slice(i, next)
      out.push(processTextChunk(text, wrappedSet))
      i = next === -1 ? html.length : next
    }
  }
  return out.join('')
}

function processTextChunk(text: string, wrappedSet: Set<string>): string {
  for (const match of SORTED_MATCHES) {
    if (wrappedSet.has(match)) continue
    const idx = text.indexOf(match)
    if (idx === -1) continue
    // Sanity: don't match inside a longer word ("278" inside "1278x").
    // Cheap word-edge check on neighbors.
    const before = idx > 0 ? text[idx - 1] : ' '
    const after = idx + match.length < text.length ? text[idx + match.length] : ' '
    if (isWordEdge(before, match[0]) && isWordEdge(match[match.length - 1], after)) {
      const entry = GLOSSARY_BY_MATCH.get(match)!
      const span = renderTermSpan(entry, text.slice(idx, idx + match.length))
      text = text.slice(0, idx) + span + text.slice(idx + match.length)
      wrappedSet.add(match)
    }
  }
  return text
}

/** A word-edge is when the boundary character is non-alphanumeric.
 *  Hyphens, slashes, spaces, punctuation all count as edges, so
 *  "CO-50", "270/271", and "modifier 25" all wrap correctly without
 *  matching mid-token. */
function isWordEdge(left: string, right: string): boolean {
  const isWord = (ch: string) => /[A-Za-z0-9]/.test(ch)
  return !(isWord(left) && isWord(right))
}

function renderTermSpan(entry: GlossaryEntry, displayText: string): string {
  const display = entry.term ?? entry.match
  return (
    `<span class="term" data-term="${escape(display)}" ` +
    `title="${escape(entry.plain)}">` +
    `${escape(displayText)}<span class="term-icon">?</span>` +
    `</span>`
  )
}

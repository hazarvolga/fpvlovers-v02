import Link from 'next/link';
import { BadgeCheck, Bot, FileSearch, ShieldAlert } from 'lucide-react';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import {
  PRODUCT_REVIEW_EDITOR,
  isApprovedHandsOnReview,
} from '@/lib/content-automation/editorial-governance';

function relationshipLabel(value: string | undefined): string {
  if (value === 'purchased') return 'Purchased by FPVLovers';
  if (value === 'supplied') return 'Supplied by the brand or retailer';
  if (value === 'loaned') return 'Temporary loan unit';
  return 'No physical unit recorded';
}

export function EditorialTrustPanel({ article }: { article: PublishedArtifact }) {
  const isReview = article.metadata?.contentType === 'review';
  const handsOnApproved = isApprovedHandsOnReview(article.editorial);
  const reviewRecord = article.editorial?.contentClass === 'product-review'
    ? article.editorial
    : undefined;
  const specReviewApproved = isReview
    && reviewRecord?.approvalStatus === 'approved'
    && reviewRecord.testingMethod === 'spec-analysis';
  const commercial = ['review', 'comparison', 'buyer-guide', 'product-roundup']
    .includes(article.metadata?.contentType || '');

  return (
    <aside className="mb-10 rounded-xl border border-[#FF5C00]/25 bg-black/45 p-5 text-xs text-zinc-300 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">
        {handsOnApproved ? <BadgeCheck className="h-4 w-4" /> : isReview ? <FileSearch className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        Editorial trust status
      </div>

      {handsOnApproved ? (
        <div className="mt-3 space-y-2 leading-5">
          <p><strong className="text-white">Hands-on product review.</strong> Approved by {PRODUCT_REVIEW_EDITOR}.</p>
          <p>Product relationship: {relationshipLabel(reviewRecord?.productRelationship)}.</p>
          {reviewRecord?.reviewedAt && <p>Reviewed: {new Date(reviewRecord.reviewedAt).toLocaleDateString('en-US')}.</p>}
        </div>
      ) : specReviewApproved ? (
        <div className="mt-3 space-y-2 leading-5">
          <p><strong className="text-white">Editor-approved specification analysis.</strong> Reviewed by {reviewRecord?.editorName || PRODUCT_REVIEW_EDITOR}; no hands-on product test is claimed.</p>
          <p>Product relationship: {relationshipLabel(reviewRecord?.productRelationship)}.</p>
          {reviewRecord?.reviewedAt && <p>Reviewed: {new Date(reviewRecord.reviewedAt).toLocaleDateString('en-US')}.</p>}
          {reviewRecord?.evidenceSources.length ? (
            <p>Evidence sources recorded: {reviewRecord.evidenceSources.length}.</p>
          ) : null}
        </div>
      ) : isReview ? (
        <div className="mt-3 space-y-2 leading-5">
          <p className="flex gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C00]" /> This review does not have a complete hands-on test and editor approval record. Treat it as specification-based analysis; any numeric score should be withheld.</p>
        </div>
      ) : (
        <p className="mt-3 leading-5">
          This non-review article may be produced through FPVLovers&apos; autonomous research workflow. It is not a hands-on product test. Technical claims remain subject to source checks, correction requests, and future editor review where needed.
        </p>
      )}

      {commercial && (
        <p className="mt-3 border-t border-white/10 pt-3 leading-5 text-zinc-400">
          Commercial disclosure: links may become affiliate links and may earn FPVLovers a commission at no additional cost to the reader. <Link href="/disclosure" className="text-[#FF5C00] hover:underline">Read the disclosure</Link> or <Link href="/editorial-policy" className="text-[#FF5C00] hover:underline">editorial policy</Link>.
          <span className="ml-1">Brands with a review unit can use <Link href="/advertise#product-evaluation" className="text-[#FF5C00] hover:underline">the product evaluation brief</Link>.</span>
        </p>
      )}
    </aside>
  );
}

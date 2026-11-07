import { Check, ChevronRight } from 'lucide-react';

export default function MobileGroupedRow({ title, subtitle, leading, trailing, current = false, chevron = true, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-current={current ? 'true' : undefined} className="ios-row">
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[17px] font-normal leading-[22px] tracking-[-0.4px]">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-ios-muted">{subtitle}</span>}
      </span>
      {trailing}
      {current ? (
        <><Check className="h-5 w-5 shrink-0 text-ios-tint" aria-hidden="true" /><span className="sr-only">Current</span></>
      ) : chevron && <ChevronRight className="h-4 w-4 shrink-0 text-ios-muted" strokeWidth={2.5} aria-hidden="true" />}
    </button>
  );
}
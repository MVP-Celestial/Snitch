from pathlib import Path
p=Path('src/features/cart/pages/Cart.jsx')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("import '../../products/pages/Home.css'\n",'').replace("import './Cart.css'\n",'')
classes={
'shop-home cart-page': 'min-h-screen bg-[var(--bag-bg)] text-[var(--bag-ink)] [--bag-bg:#f6f2eb] [--bag-panel:#eee8de] [--bag-ink:#29251f] [--bag-muted:#736b60] [--bag-line:#dcd4c8] [--bag-accent:#955b3d] data-[theme=dark]:[--bag-bg:#181612] data-[theme=dark]:[--bag-panel:#232019] data-[theme=dark]:[--bag-ink:#f3ecdf] data-[theme=dark]:[--bag-muted:#b1a693] data-[theme=dark]:[--bag-line:#3c352b] data-[theme=dark]:[--bag-accent:#d7a27b] [&_a]:no-underline [&_a]:text-inherit [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[var(--bag-accent)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[var(--bag-accent)]',
'home-header': 'relative flex min-h-[108px] items-center justify-between border-b border-[var(--bag-line)] px-[6%] py-5 max-[720px]:min-h-[90px] max-[720px]:px-[5%] max-[720px]:py-[15px] [&_nav]:flex [&_nav]:items-center [&_nav]:gap-[25px] [&_nav]:text-xs max-[720px]:[&_nav]:gap-3 max-[720px]:[&_nav]:text-[10px] [&_nav>a]:inline-flex [&_nav>a]:items-center [&_nav>a]:gap-[9px]',
'home-brand': 'block shrink-0',
'celestial-logo': 'block h-[66px] w-[126px] object-contain max-[720px]:h-14 max-[720px]:w-[105px]',
'home-theme-toggle': 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--bag-line)] bg-transparent px-3 text-inherit hover:bg-[var(--bag-panel)] max-[720px]:px-[10px] max-[720px]:[&_span]:hidden',
'bag-main': 'mx-auto box-border min-h-[calc(100vh-210px)] max-w-[1320px] px-[6%] pt-[34px] pb-20 max-[720px]:px-[5%] max-[720px]:pt-[26px] max-[720px]:pb-[50px]',
'bag-back': 'inline-flex items-center gap-[10px] text-xs text-[var(--bag-muted)]!',
'bag-heading': 'flex items-end justify-between gap-5 pt-12 pb-9 max-[720px]:pt-9 max-[720px]:pb-7 [&_h1]:m-0 [&_h1]:text-[clamp(46px,5vw,70px)] [&_h1]:leading-[1.1] [&_h1]:font-normal [&_h1]:tracking-[-3px] [&_h1_span]:mt-[9px] [&_h1_span]:ml-4 [&_h1_span]:inline-block [&_h1_span]:align-top [&_h1_span]:text-[15px] [&_h1_span]:tracking-normal [&_h1_span]:text-[var(--bag-accent)] [&>p]:mb-[3px] [&>p]:text-xs [&>p]:leading-[1.8] [&>p]:text-[var(--bag-muted)] max-[720px]:[&>p]:hidden',
'bag-eyebrow': 'mb-3 text-[9px] leading-[1.6] tracking-[2px] text-[var(--bag-muted)]',
'bag-loading': 'border-t border-[var(--bag-line)] py-[26px] [&>p]:flex [&>p]:items-center [&>p]:gap-[10px] [&>p]:text-xs [&>p]:text-[var(--bag-muted)]',
'bag-skeleton': 'mb-5 h-[170px] max-w-[700px] animate-pulse rounded bg-[var(--bag-panel)] motion-reduce:animate-none',
'bag-spin': 'animate-spin motion-reduce:animate-none',
'bag-state': 'border-y border-[var(--bag-line)] px-5 pt-[70px] pb-20 text-center max-[720px]:px-3 max-[720px]:py-[55px] [&>svg]:mx-auto [&>svg]:text-[var(--bag-accent)] [&_h2]:my-3 [&_h2]:text-[clamp(26px,3vw,36px)] [&_h2]:font-normal [&_h2]:tracking-[-1px] [&>p:not([data-eyebrow])]:mb-[26px] [&>p:not([data-eyebrow])]:text-[13px] [&>p:not([data-eyebrow])]:leading-[1.9] [&>p:not([data-eyebrow])]:text-[var(--bag-muted)]',
'bag-empty-icon': 'mx-auto mb-7 grid size-[88px] place-items-center rounded-full border border-[var(--bag-line)] text-[var(--bag-accent)]',
'bag-desktop-break': 'max-[720px]:hidden',
'bag-layout': 'grid grid-cols-[minmax(0,1fr)_325px] items-start gap-[54px] max-[1000px]:grid-cols-[minmax(0,1fr)_290px] max-[1000px]:gap-7 max-[720px]:grid-cols-1 max-[720px]:gap-[35px]',
'bag-items': 'min-w-0',
'bag-list-heading': 'flex justify-between border-y border-[var(--bag-line)] py-[17px] text-[10px] tracking-[1px] text-[var(--bag-muted)]',
'bag-item': 'grid grid-cols-[126px_minmax(0,1fr)_auto] gap-[23px] border-b border-[var(--bag-line)] py-[26px] max-[1000px]:grid-cols-[100px_minmax(0,1fr)] max-[1000px]:gap-[18px]',
'bag-item-image': 'aspect-[4/5] overflow-hidden rounded-[3px] bg-[#e5dfd4] [&_img]:h-full [&_img]:w-full [&_img]:object-contain',
'bag-image-fallback': 'box-border flex h-full flex-col items-center justify-center gap-[10px] p-2 text-center text-[9px] text-[#766c60]',
'bag-item-info': 'min-w-0 py-[5px] [&_h2]:mb-[10px] [&_h2]:text-[19px] [&_h2]:font-medium [&_h2]:tracking-[-.5px] [&_h2]:[overflow-wrap:anywhere] [&_h2_a:hover]:text-[var(--bag-accent)] max-[720px]:[&_h2]:text-lg',
'bag-attributes': 'flex flex-wrap gap-x-[15px] gap-y-[5px] text-[11px] text-[var(--bag-muted)] capitalize',
'bag-unit-price': 'mt-[10px] mb-4 text-[11px] text-[var(--bag-muted)]',
'bag-quantity': 'inline-flex h-[34px] items-center gap-[14px] text-[11px] [&>span]:text-[var(--bag-muted)] [&_output]:min-w-[15px] [&_output]:text-center [&_button]:grid [&_button]:size-[34px] [&_button]:place-items-center [&_button]:rounded-full [&_button]:border [&_button]:border-[var(--bag-line)] [&_button]:bg-transparent [&_button]:text-[var(--bag-ink)] [&_button]:transition-colors [&_button:enabled:hover]:bg-[var(--bag-panel)] [&_button:disabled]:opacity-35',
'bag-item-note': 'text-[10px] leading-[1.7] text-[var(--bag-muted)]',
'bag-line-total': 'mt-[29px] text-right text-sm font-medium whitespace-nowrap max-[1000px]:col-start-2 max-[1000px]:m-0 max-[1000px]:text-left',
'bag-error': 'my-3 rounded-[3px] border border-[var(--bag-line)] p-[14px] text-xs text-[var(--bag-accent)]',
'bag-notice': 'my-3 text-xs text-[var(--bag-accent)] empty:hidden',
'bag-continue': 'mt-[22px] inline-flex items-center gap-[10px] text-xs',
'bag-summary': 'sticky top-[25px] rounded border border-[var(--bag-line)] bg-[var(--bag-panel)] p-[29px] max-[1000px]:p-[23px] max-[720px]:static [&_h2]:mb-[30px] [&_h2]:text-[25px] [&_h2]:font-normal [&_h2]:tracking-[-.9px]',
'bag-summary-row': 'my-[18px] flex justify-between gap-[14px] text-xs [&>span:first-child]:text-[var(--bag-muted)] [&_strong]:font-medium',
'bag-summary-row bag-delivery': 'my-[18px] flex justify-between gap-[14px] border-b border-[var(--bag-line)] pb-[22px] text-[11px] [&>span:first-child]:text-[var(--bag-muted)]',
'bag-summary-total': 'flex justify-between gap-[14px] pt-[7px] pb-[27px] text-sm [&_strong]:mb-1 [&_strong]:block [&_strong]:text-right [&_strong]:font-medium',
'bag-checkout-note': 'mt-[10px] text-[10px] leading-[1.7] text-[var(--bag-muted)]',
'bag-summary-foot': 'mt-[26px] flex items-center gap-3 border-t border-[var(--bag-line)] pt-[23px] text-[10px] leading-[1.7] text-[var(--bag-muted)]',
'bag-capability-note': 'mt-9 text-[11px] leading-[1.7] text-[var(--bag-muted)]',
'bag-footer': 'flex items-center justify-between gap-5 border-t border-[var(--bag-line)] px-[6%] py-7 text-[10px] text-[var(--bag-muted)] [&>span]:tracking-[2px] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 max-[720px]:flex-wrap max-[720px]:px-[5%] max-[720px]:[&_p]:hidden',
}
primary='inline-flex min-h-12 box-border items-center justify-center gap-[25px] rounded-full border-0 bg-[var(--bag-ink)] px-[22px] py-[17px] text-xs text-[var(--bag-bg)]! disabled:cursor-not-allowed disabled:opacity-50'
classes['bag-primary']=primary
for old,new in classes.items():
    s=s.replace('className="'+old+'"','className="'+new+'"')
s=s.replace('<p className="'+classes['bag-eyebrow']+'">','<p data-eyebrow className="'+classes['bag-eyebrow']+'">')
s=s.replace('<div className="'+classes['bag-item-info']+'"><p data-eyebrow className="'+classes['bag-eyebrow']+'">','<div className="'+classes['bag-item-info']+'"><p data-eyebrow className="mb-[9px] text-[8px] leading-[1.6] tracking-[1.5px] text-[var(--bag-muted)]">')
s=s.replace('<button type="button" className="'+primary+'" disabled', '<button type="button" className="'+primary.replace('gap-[25px]','gap-3').replace('px-[22px]','w-full px-3')+'" disabled')
# Semantic test hooks, independent of the styling system.
for tag,old,test in [('article','bag-item','cart-item'),('aside','bag-summary','cart-summary'),('div','bag-summary-total','cart-total')]:
    s=s.replace('<'+tag+' className="'+classes[old]+'"','<'+tag+' data-testid="'+test+'" className="'+classes[old]+'"')
p.write_text(s,encoding='utf-8')

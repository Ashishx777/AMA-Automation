/*
 * Layout components for ad types beyond testimonial.
 *
 * Each layout receives the same props as testimonial layouts:
 *   variation { id, layout, headline, body, author, rating, cta, pos, meta? }
 *   pos       — drag positions for THIS layout (shared across frames; _pos bucket)
 *   sizes     — shared _size bucket
 *   F         — {w,h,label,previewW}
 *   frame     — 'square' | 'story'
 *   editOn    — bool
 *   onPosChange(role, fracPos) — persists drag
 *   onResize(role, {w[,h]})    — persists size
 *   accent    — brand accent color
 *   fontStack, fontH2 — typography pair
 *
 * Frame pixel scale: designs are drawn at F.w × F.h (1080/1920), scaled down
 * by the host. Keep body text ≥28px at that scale.
 *
 * DraggableBlock is expected to be in global scope (loaded from Social Proof
 * Ad Template.html). It re-renders its children inside an absolutely-positioned
 * wrapper and handles drag/resize.
 */

/* ═══════════════════════════════════════════════════════════════════════
 *  DM AD TYPE · Instagram / iMessage / WhatsApp / SMS
 *  One tall "phone chat screen" card floats over the lifestyle/product image.
 * ═══════════════════════════════════════════════════════════════════════ */

const TickIcon = ({ color = '#8e8e8e', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M2 9l3.5 3.5L14 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BlueTicks = ({ size = 14 }) => (
  <svg width={size * 1.4} height={size} viewBox="0 0 22 16" fill="none">
    <path d="M2 9l3.5 3.5L14 4" stroke="#34b7f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 9l3.5 3.5L19 4" stroke="#34b7f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* --- Instagram DM ---------------------------------------------------- */
function LayoutDMInstagram({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.68 };
  const cardPos = pos.card || { x: 0.08, y: 0.14 };

  const handle = variation.author || 'arjun.s';
  const displayName = variation.headline || 'Arjun S.';
  const body = variation.body || 'Write your DM testimonial body here. Sounds like a real message from a real person — 2 or 3 short paragraphs.';
  const reactions = (variation.cta || '❤️').trim();

  const paragraphs = body.split(/\n\n+/);

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.5} maxWidthFrac={0.94}
      handleLabel="Instagram DM">
      <div style={{
        width: '100%', background: '#fff', borderRadius: 32,
        boxShadow: '0 30px 80px rgba(0,0,0,.25), 0 8px 20px rgba(0,0,0,.12)',
        overflow: 'hidden', fontFamily: fontH2 }}>
        {/* Status bar */}
        <div style={{ padding: '18px 28px 0 28px', display: 'flex', justifyContent: 'space-between',
          fontSize: 22, fontWeight: 600, color: '#000' }}>
          <span>13:41</span>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 18 }}>
            <span>•••</span>
            <span>▲</span>
            <span style={{ width: 32, height: 16, border: '1.5px solid #000', borderRadius: 3, position: 'relative', background: 'linear-gradient(90deg, #000 70%, transparent 70%)' }} />
          </span>
        </div>
        {/* Header */}
        <div style={{ padding: '18px 28px 16px 28px', display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: '1px solid #efefef' }}>
          <span style={{ fontSize: 26, color: '#000', lineHeight: 1 }}>←</span>
          <div style={{ width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)',
            padding: 3, flexShrink: 0 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ddd',
              backgroundImage: 'radial-gradient(circle at 35% 40%, #c9a38a, #86604a)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 26, color: '#000', display: 'flex', alignItems: 'center', gap: 6 }}>
              {displayName} <span style={{ fontSize: 20, color: '#333' }}>›</span>
            </div>
            <div style={{ fontSize: 22, color: '#8e8e8e', marginTop: 2 }}>{handle}</div>
          </div>
          <div style={{ display: 'flex', gap: 22, fontSize: 28, color: '#000' }}>
            <span>📞</span>
            <span>📹</span>
          </div>
        </div>
        {/* Timestamp */}
        <div style={{ textAlign: 'center', color: '#8e8e8e', fontSize: 22, padding: '18px 0 8px 0', fontWeight: 600 }}>
          Today 12:02 pm
        </div>
        {/* Bubble */}
        <div style={{ padding: '12px 28px 20px 28px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ background: '#eeeeee', color: '#000', padding: '22px 26px', borderRadius: 24,
            fontSize: 30, lineHeight: 1.4, maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
            {paragraphs.map((p, i) => (
              <div key={i} style={{ marginBottom: i < paragraphs.length - 1 ? '1em' : 0 }}>{p}</div>
            ))}
          </div>
        </div>
        {/* Reaction */}
        <div style={{ padding: '0 28px 24px 36px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ddd',
            backgroundImage: 'radial-gradient(circle at 35% 40%, #c9a38a, #86604a)' }} />
          <div style={{ background: '#f2f2f2', padding: '8px 14px', borderRadius: 999, fontSize: 26 }}>
            {reactions}
          </div>
        </div>
      </div>
    </DraggableBlock>
  );
}

/* --- iMessage (blue bubbles) ---------------------------------------- */
function LayoutDMiMessage({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.70 };
  const cardPos = pos.card || { x: 0.07, y: 0.14 };

  const name = variation.headline || 'Priya';
  const body = variation.body || 'Honestly obsessed with this one. Back in my rotation already.';
  const replyText = variation.author || 'Already choosing for it ☕';
  const reaction = variation.cta || '';

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.5} maxWidthFrac={0.94}
      handleLabel="iMessage">
      <div style={{
        width: '100%', background: '#fff', borderRadius: 28,
        boxShadow: '0 30px 80px rgba(0,0,0,.25), 0 8px 20px rgba(0,0,0,.12)',
        overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
        {/* Header */}
        <div style={{ padding: '22px 24px 18px 24px', textAlign: 'center', borderBottom: '0.5px solid #d4d4d4' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#000' }}>New Message</div>
          <div style={{ fontSize: 18, color: '#8e8e93', marginTop: 4 }}>Today 11:11 am</div>
        </div>
        {/* Incoming gray bubble */}
        <div style={{ padding: '24px 24px 8px 24px', display: 'flex' }}>
          <div style={{ background: '#e9e9eb', color: '#000', padding: '16px 22px', borderRadius: 24,
            fontSize: 28, lineHeight: 1.35, maxWidth: '78%', position: 'relative' }}>
            {name}
          </div>
        </div>
        {/* Incoming body */}
        <div style={{ padding: '0 24px 24px 24px', display: 'flex' }}>
          <div style={{ background: '#e9e9eb', color: '#000', padding: '16px 22px', borderRadius: 24,
            fontSize: 28, lineHeight: 1.35, maxWidth: '80%' }}>
            {body}
          </div>
        </div>
        {/* Reply composer */}
        <div style={{ padding: '10px 18px 22px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f1f1', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#888', flexShrink: 0 }}>+</div>
          <div style={{ flex: 1, border: '1px solid #d4d4d4', borderRadius: 999, padding: '14px 22px',
            fontSize: 26, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyText}</span>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#007aff', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>↑</div>
          </div>
        </div>
      </div>
    </DraggableBlock>
  );
}

/* --- WhatsApp -------------------------------------------------------- */
function LayoutDMWhatsApp({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.68 };
  const cardPos = pos.card || { x: 0.08, y: 0.14 };

  const name = variation.headline || 'Priya ✨';
  const body = variation.body || 'Ok but seriously where did you get this?? Obsessed';
  const timestamp = variation.author || '12:02';

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.5} maxWidthFrac={0.94}
      handleLabel="WhatsApp">
      <div style={{
        width: '100%', background: '#efe7de', borderRadius: 28,
        boxShadow: '0 30px 80px rgba(0,0,0,.25), 0 8px 20px rgba(0,0,0,.12)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'><g fill=\'%23d9cfc3\' opacity=\'0.4\'><circle cx=\'20\' cy=\'20\' r=\'1.5\'/><circle cx=\'60\' cy=\'40\' r=\'1\'/><path d=\'M30 60 q5 -5 10 0\' fill=\'none\' stroke=\'%23d9cfc3\' stroke-width=\'1\'/></g></svg>")',
      }}>
        {/* Header */}
        <div style={{ background: '#008069', color: '#fff', padding: '18px 22px', display: 'flex',
          alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 26 }}>←</span>
          <div style={{ width: 52, height: 52, borderRadius: '50%',
            backgroundImage: 'radial-gradient(circle at 35% 40%, #c9a38a, #86604a)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 26 }}>{name}</div>
            <div style={{ fontSize: 18, opacity: .85 }}>online</div>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 26 }}>
            <span>📹</span><span>📞</span><span>⋮</span>
          </div>
        </div>
        {/* Bubble */}
        <div style={{ padding: '28px 20px 28px 20px', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ background: '#fff', color: '#111', padding: '14px 18px 10px 18px',
            borderRadius: '14px 14px 14px 4px', fontSize: 28, lineHeight: 1.35,
            maxWidth: '80%', boxShadow: '0 1px 2px rgba(0,0,0,.08)', position: 'relative' }}>
            <div style={{ whiteSpace: 'pre-wrap', paddingRight: 50 }}>{body}</div>
            <div style={{ position: 'absolute', bottom: 6, right: 12, fontSize: 18,
              color: '#8696a0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {timestamp} <BlueTicks size={12} />
            </div>
          </div>
        </div>
      </div>
    </DraggableBlock>
  );
}

/* --- SMS (iOS green) ------------------------------------------------ */
function LayoutDMSMS({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.70 };
  const cardPos = pos.card || { x: 0.07, y: 0.16 };

  const name = variation.headline || 'Mom';
  const body = variation.body || 'I love what you sent! Please tell me where you found it.';
  const timestamp = variation.author || 'Delivered';

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.5} maxWidthFrac={0.94}
      handleLabel="SMS">
      <div style={{
        width: '100%', background: '#fff', borderRadius: 28,
        boxShadow: '0 30px 80px rgba(0,0,0,.25), 0 8px 20px rgba(0,0,0,.12)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', textAlign: 'center', borderBottom: '0.5px solid #d4d4d4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 28, color: '#34c759' }}>←</span>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%',
              backgroundImage: 'radial-gradient(circle at 35% 40%, #c9a38a, #86604a)',
              margin: '0 auto 6px' }} />
            <div style={{ fontSize: 20, fontWeight: 600, color: '#000' }}>{name} <span style={{ color: '#8e8e93' }}>›</span></div>
          </div>
          <span style={{ fontSize: 26 }}>📹</span>
        </div>
        {/* Green bubble incoming */}
        <div style={{ padding: '28px 24px 8px 24px', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ background: '#34c759', color: '#fff', padding: '16px 22px', borderRadius: 24,
            fontSize: 28, lineHeight: 1.35, maxWidth: '80%' }}>
            {body}
          </div>
        </div>
        <div style={{ textAlign: 'left', padding: '4px 32px 24px', fontSize: 18, color: '#8e8e93' }}>
          {timestamp}
        </div>
      </div>
    </DraggableBlock>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  REVIEW CARD AD TYPE · PMS-ease style + two more
 * ═══════════════════════════════════════════════════════════════════════ */

/* --- Bubble review (PMS-ease reference) ---------------------------- */
function LayoutReviewBubble({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.62 };
  const cardPos = pos.card || { x: 0.06, y: 0.18 };

  const shortTitle = variation.headline || 'Honestly for me';
  const review = variation.body || 'I used to avoid fitted clothes just before periods, but now I don\'t feel bloated and my cramps also reduced';
  const author = variation.author || '';

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.4} maxWidthFrac={0.9}
      handleLabel="Review bubbles">
      <div style={{ width: '100%', fontFamily: fontH2, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Gray pill */}
        <div style={{ alignSelf: 'flex-start', background: 'rgba(245,240,232,.95)', color: '#1a1410',
          padding: '18px 28px', borderRadius: 24, fontSize: 30, fontWeight: 500, maxWidth: '85%',
          boxShadow: '0 8px 30px rgba(0,0,0,.08)' }}>
          {shortTitle}
        </div>
        {/* Colored bubble */}
        <div style={{ alignSelf: 'flex-start', background: accent, color: '#fff',
          padding: '26px 32px', borderRadius: 28, fontSize: 32, fontWeight: 500, lineHeight: 1.4,
          maxWidth: '95%', boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
          {review}
          {author && <div style={{ fontSize: 24, opacity: .85, marginTop: 12, fontWeight: 400 }}>— {author}</div>}
        </div>
      </div>
    </DraggableBlock>
  );
}

/* --- Star card (classic 5-star review card floating) --------------- */
function LayoutReviewStars({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.58 };
  const cardPos = pos.card || { x: 0.07, y: 0.5 };

  const headline = variation.headline || 'Life-changing';
  const review = variation.body || 'Worth every rupee. I\'ve tried six others and none come close.';
  const author = variation.author || 'Verified buyer';
  const rating = variation.rating ?? 5;

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.4} maxWidthFrac={0.92}
      handleLabel="Star card">
      <div style={{ width: '100%', background: '#fff', borderRadius: 24, padding: '36px 40px',
        fontFamily: fontH2, boxShadow: '0 20px 60px rgba(0,0,0,.18)', display: 'flex',
        flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Stars rating={rating} size={44} color={accent} />
          <span style={{ fontSize: 22, color: '#6a6055', fontWeight: 600, marginLeft: 6 }}>
            {rating.toFixed ? rating.toFixed(1) : rating}/5
          </span>
        </div>
        <div style={{ fontFamily: fontStack, fontSize: 48, lineHeight: 1.1, color: '#13100c', fontWeight: 600 }}>
          {headline}
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.45, color: '#3a342c' }}>
          "{review}"
        </div>
        <div style={{ fontSize: 22, color: '#8a7a5a', fontWeight: 600, letterSpacing: .3 }}>
          — {author}
        </div>
      </div>
    </DraggableBlock>
  );
}

/* --- Polaroid review (card tilted at angle with handwritten quote) - */
function LayoutReviewPolaroid({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.52 };
  const cardPos = pos.card || { x: 0.22, y: 0.55 };

  const quote = variation.body || 'My skin has never looked like this before.';
  const author = variation.author || 'Aanya, 28';
  const rating = variation.rating ?? 5;

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.35} maxWidthFrac={0.85}
      handleLabel="Polaroid">
      <div style={{ width: '100%', background: '#fdfaf3', borderRadius: 6, padding: '28px 32px 44px 32px',
        fontFamily: fontH2, boxShadow: '0 30px 70px rgba(0,0,0,.25), 0 4px 8px rgba(0,0,0,.12)',
        transform: 'rotate(-3deg)', border: '1px solid rgba(0,0,0,.04)' }}>
        <div style={{ fontFamily: fontStack, fontSize: 46, lineHeight: 1.15, color: '#13100c',
          fontStyle: 'italic', marginBottom: 16 }}>
          "{quote}"
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 22, color: '#6a6055', fontWeight: 600 }}>— {author}</div>
          <Stars rating={rating} size={30} color={accent} />
        </div>
      </div>
    </DraggableBlock>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  UI AD TYPE · AirDrop / iOS notification / iMessage composer
 * ═══════════════════════════════════════════════════════════════════════ */

/* --- AirDrop popup -------------------------------------------------- */
function LayoutUIAirDrop({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.60 };
  const cardPos = pos.card || { x: 0.20, y: 0.22 };

  const title = variation.headline || 'AirDrop';
  const subtitle = variation.body || 'Anya wants to share "morning-routine.jpg"';
  // CTA format: "Decline / Accept" — optional. Falls back to sensible defaults.
  const ctaStr = variation.cta || 'Decline / Accept';
  const [declineLabel, acceptLabel] = ctaStr.split('/').map((s) => s.trim());

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.4} maxWidthFrac={0.9}
      handleLabel="AirDrop">
      <div style={{ width: '100%', background: '#fff', borderRadius: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        boxShadow: '0 30px 80px rgba(0,0,0,.3), 0 8px 20px rgba(0,0,0,.15)', overflow: 'hidden' }}>
        <div style={{ padding: '36px 36px 20px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 46, fontWeight: 700, color: '#000' }}>{title}</div>
          <div style={{ fontSize: 26, color: '#6e6e73', marginTop: 14, lineHeight: 1.35 }}>
            {subtitle}
          </div>
        </div>
        {/* Preview area — user's uploaded image shows via frame bg; reserve visual breathing room */}
        <div style={{ height: 220, background: 'rgba(0,0,0,.05)',
          backgroundImage: 'linear-gradient(135deg, #f5f3ee 25%, transparent 25%, transparent 75%, #f5f3ee 75%), linear-gradient(135deg, #f5f3ee 25%, #ebe6da 25%, #ebe6da 75%, #f5f3ee 75%)',
          backgroundSize: '24px 24px', backgroundPosition: '0 0, 12px 12px', opacity: 0 }} />
        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', borderTop: '0.5px solid #d4d4d4' }}>
          <button style={{ padding: '26px 0', fontSize: 30, color: '#007aff', background: 'none',
            border: 'none', cursor: 'default' }}>{declineLabel || 'Decline'}</button>
          <div style={{ background: '#d4d4d4' }} />
          <button style={{ padding: '26px 0', fontSize: 30, color: '#007aff', fontWeight: 700,
            background: 'none', border: 'none', cursor: 'default' }}>{acceptLabel || 'Accept'}</button>
        </div>
      </div>
    </DraggableBlock>
  );
}

/* --- iOS notification banner ---------------------------------------- */
function LayoutUINotification({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.78 };
  const cardPos = pos.card || { x: 0.11, y: 0.12 };

  const app = variation.headline || 'MESSAGES';
  const title = variation.body?.split('\n')[0] || 'Priya';
  const bodyText = variation.body?.split('\n').slice(1).join(' ') || 'Already bought it because of you 🥹';
  const time = variation.author || 'now';

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.5} maxWidthFrac={0.96}
      handleLabel="Notification">
      <div style={{ width: '100%', background: 'rgba(250,250,250,.85)',
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        borderRadius: 26, padding: '22px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        boxShadow: '0 30px 60px rgba(0,0,0,.25), 0 4px 10px rgba(0,0,0,.1)', display: 'flex', gap: 16,
        border: '0.5px solid rgba(255,255,255,.4)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: '#34c759',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>💬</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 18, color: '#6e6e73', letterSpacing: .8, fontWeight: 600 }}>{app}</span>
            <span style={{ fontSize: 18, color: '#6e6e73' }}>{time}</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#000', marginTop: 4 }}>{title}</div>
          <div style={{ fontSize: 25, color: '#000', marginTop: 3, lineHeight: 1.3 }}>{bodyText}</div>
        </div>
      </div>
    </DraggableBlock>
  );
}

/* --- iMessage composer (Post gym coffee reference) ------------------ */
function LayoutUIComposer({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const cardSize = sizes.card || { w: 0.72 };
  const cardPos = pos.card || { x: 0.14, y: 0.09 };

  const title = variation.headline || 'New Message';
  const timestamp = 'Today 11:11 am';
  const incoming = variation.body || 'Post gym coffee?';
  const reply = variation.author || 'Already choosing for it ☕';

  return (
    <DraggableBlock
      frac={cardPos} onChange={(p) => onPosChange('card', p)}
      size={cardSize} onResize={(s) => onResize('card', s)}
      frameW={F.w} frameH={F.h} editOn={editOn}
      widthFrac={cardSize.w} minWidthFrac={0.5} maxWidthFrac={0.94}
      handleLabel="Composer">
      <div style={{ width: '100%', background: '#fff', borderRadius: 28, overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        boxShadow: '0 30px 80px rgba(0,0,0,.3), 0 8px 20px rgba(0,0,0,.15)' }}>
        <div style={{ padding: '22px 24px 16px', textAlign: 'center', borderBottom: '0.5px solid #d4d4d4' }}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 18, color: '#8e8e93', marginTop: 4 }}>{timestamp}</div>
        </div>
        <div style={{ padding: '24px 24px 8px', display: 'flex' }}>
          <div style={{ background: '#e9e9eb', color: '#000', padding: '16px 22px', borderRadius: 24,
            fontSize: 28, lineHeight: 1.35, maxWidth: '78%' }}>{incoming}</div>
        </div>
        <div style={{ padding: '16px 18px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f1f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#888', flexShrink: 0 }}>+</div>
          <div style={{ flex: 1, border: '1px solid #d4d4d4', borderRadius: 999, padding: '14px 22px',
            fontSize: 26, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reply}</span>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ff3b30', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>↑</div>
          </div>
        </div>
      </div>
    </DraggableBlock>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  LABELLED PRODUCT AD TYPE · iMessage bubbles pointing at product
 *  Supports N draggable labels (positions stored as label0, label1, …).
 * ═══════════════════════════════════════════════════════════════════════ */

const DEFAULT_LABEL_POSITIONS = [
  { x: 0.04, y: 0.08 },  // top-left
  { x: 0.68, y: 0.16 },  // top-right
  { x: 0.04, y: 0.40 },  // mid-left
  { x: 0.68, y: 0.44 },  // mid-right
  { x: 0.04, y: 0.72 },  // bot-left
  { x: 0.68, y: 0.80 },  // bot-right
];

/* Parse body into labels: newline separated. Max 8 labels shown. */
function parseLabels(body) {
  if (!body) return ['No Slouching', 'Less Strain', 'Better Balance', 'Stronger Stance', 'Aligned Steps', 'Better Form'];
  return body.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
}

function LabelBubble({ text, side }) {
  // side: 'left' or 'right' — tail direction
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        background: '#d6e2fd', color: '#111', padding: '16px 24px', borderRadius: 24,
        fontSize: 28, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        whiteSpace: 'nowrap',
      }}>
        {text}
      </div>
      {/* Small tail */}
      <div style={{ position: 'absolute',
        [side === 'left' ? 'right' : 'left']: -6, bottom: 12,
        width: 18, height: 18, borderRadius: '50%', background: '#d6e2fd' }} />
    </div>
  );
}

function LayoutLabelledBubbles({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const labels = parseLabels(variation.body);

  return (
    <>
      {labels.map((text, i) => {
        const role = `label${i}`;
        const p = pos[role] || DEFAULT_LABEL_POSITIONS[i % DEFAULT_LABEL_POSITIONS.length];
        const side = p.x < 0.5 ? 'left' : 'right';
        return (
          <DraggableBlock
            key={role}
            frac={p} onChange={(np) => onPosChange(role, np)}
            frameW={F.w} frameH={F.h} editOn={editOn}
            widthFrac={0.32} minWidthFrac={0.15} maxWidthFrac={0.6}
            handleLabel={`#${i + 1}`}>
            <LabelBubble text={text} side={side} />
          </DraggableBlock>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  UI REVIEW CLUSTER  (Tula-style "holy grail")
 *  Many small review chips (avatar + stars + 1-line) float around the
 *  product image. Each chip has its OWN draggable position + width.
 *  Body parses as N reviews, separated by blank lines, in this format:
 *      Name | 5 | One-line review text
 *  Headline renders as the kicker over the cluster (e.g. "meet your SPF
 *  holy grail"). Italic words inside *asterisks* render as italic.
 * ═══════════════════════════════════════════════════════════════════════ */

/* 6 default chip positions — alternating left/right columns, staggered Y so
   chips never overlap. Each chip is ~36% wide, so left chips sit at x≈0.02
   and right chips at x≈0.62 (38% gap from left edge → mostly-right side). */
const REVIEW_CLUSTER_DEFAULT = [
  { x: 0.34, y: 0.20 }, // 1 — top-right
  { x: 0.02, y: 0.30 }, // 2 — upper-left
  { x: 0.40, y: 0.38 }, // 3 — mid-right
  { x: 0.02, y: 0.48 }, // 4 — mid-left
  { x: 0.42, y: 0.58 }, // 5 — lower-right
  { x: 0.04, y: 0.68 }, // 6 — bottom-left
];

function parseReviewCluster(body) {
  if (!body) return [
    { name: 'Saea',   rating: 5, text: 'I love wearing it without makeup\nbecause the sheen is beautiful' },
    { name: 'Briana', rating: 5, text: 'A MUST for my morning routine!' },
    { name: 'Emma',   rating: 5, text: 'I will be buying again (& again)' },
    { name: 'Loren',  rating: 5, text: "I use this everyday, even if I'm\nnot going to be outside" },
    { name: 'Joni',   rating: 5, text: 'It gives my face a nice glow\nwithout the look of greasy skin' },
    { name: 'Skyler', rating: 5, text: 'Just repurchased the big\nsize for the third time!!' },
  ];
  return body.split(/\n\n+/).map((chunk) => {
    const parts = chunk.split('|').map((s) => s.trim());
    return {
      name: parts[0] || '',
      rating: parseFloat(parts[1]) || 5,
      text: (parts[2] || '').replace(/\\n/g, '\n'),
    };
  }).filter((r) => r.name || r.text).slice(0, 8);
}

function MiniStars({ rating = 5, color = '#f5b800', size = 22 }) {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    const fill = i < Math.floor(rating) ? 1 : (i < rating ? 0.5 : 0);
    stars.push(
      <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size, lineHeight: 1, color: '#e5e5e5' }}>
        <span style={{ position: 'absolute', inset: 0 }}>★</span>
        {fill > 0 && <span style={{ position: 'absolute', inset: 0, color, width: `${fill * 100}%`, overflow: 'hidden' }}>★</span>}
      </span>
    );
  }
  return <span style={{ display: 'inline-flex', gap: 2, fontSize: size, lineHeight: 1 }}>{stars}</span>;
}

function ReviewChip({ name, rating, text, accent }) {
  return (
    <div style={{
      width: '100%',
      background: '#fff',
      borderRadius: 16,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 0 0 4px rgba(255,255,255,.35), 0 12px 30px rgba(0,0,0,.18)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    }}>
      {/* Avatar placeholder */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${accent}33, ${accent}66)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, fontWeight: 700, color: '#fff',
        textTransform: 'uppercase', letterSpacing: -0.5,
      }}>
        {(name || '?').slice(0, 1)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#222' }}>{name}</span>
          <MiniStars rating={rating} size={18} />
        </div>
        <div style={{ fontSize: 18, color: '#222', lineHeight: 1.25, whiteSpace: 'pre-line' }}>{text}</div>
      </div>
    </div>
  );
}

function LayoutUIReviewCluster({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const reviews = parseReviewCluster(variation.body);
  const headline = variation.headline || 'meet your SPF\n*holy grail*';
  const headlineColor = variation.cta || '#fff';

  // Render headline with *italic* support and \n linebreaks.
  const renderHeadline = (s) => {
    const lines = s.split(/\n/);
    return lines.map((line, li) => (
      <div key={li}>
        {line.split(/(\*[^*]+\*)/g).map((seg, i) =>
          seg.startsWith('*') && seg.endsWith('*') ?
            <em key={i} style={{ fontStyle: 'italic' }}>{seg.slice(1, -1)}</em> :
            <span key={i}>{seg}</span>
        )}
      </div>
    ));
  };

  return (
    <>
      {/* Kicker headline — also draggable */}
      <DraggableBlock
        frac={pos.headline || { x: 0.06, y: 0.04 }}
        onChange={(p) => onPosChange('headline', p)}
        size={sizes.headline || { w: 0.88 }}
        onResize={(s) => onResize('headline', s)}
        frameW={F.w} frameH={F.h} editOn={editOn}
        widthFrac={(sizes.headline && sizes.headline.w) || 0.88}
        minWidthFrac={0.4} maxWidthFrac={0.96}
        handleLabel="Headline">
        <div style={{
          width: '100%',
          fontFamily: fontH2,
          fontSize: 86, lineHeight: 0.98, fontWeight: 500,
          color: headlineColor, letterSpacing: -1.5, textAlign: 'center',
          textShadow: '0 4px 24px rgba(0,0,0,.18)',
        }}>
          {renderHeadline(headline)}
        </div>
      </DraggableBlock>

      {/* Review chips */}
      {reviews.map((r, i) => {
        const role = `review${i}`;
        const p = pos[role] || REVIEW_CLUSTER_DEFAULT[i % REVIEW_CLUSTER_DEFAULT.length];
        const sz = sizes[role] || { w: 0.36 };
        return (
          <DraggableBlock
            key={role}
            frac={p} onChange={(np) => onPosChange(role, np)}
            size={sz} onResize={(ns) => onResize(role, ns)}
            frameW={F.w} frameH={F.h} editOn={editOn}
            widthFrac={sz.w} minWidthFrac={0.22} maxWidthFrac={0.7}
            handleLabel={`Review ${i + 1}`}>
            <ReviewChip name={r.name} rating={r.rating} text={r.text} accent={accent} />
          </DraggableBlock>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  UI CHAT CLUSTER  (Monday-Muse-style multi-bubble)
 *  Multiple draggable iMessage-style bubbles (incoming = gray-left,
 *  outgoing = blue-right) float over a lifestyle/product image. Plus
 *  optional kicker copy.
 *
 *  Body format — one bubble per blank-line-separated chunk:
 *      side: in | Bubble text here
 *      side: out | Other bubble text
 *  Or shorthand: "in: text" / "out: text".
 *  Headline → kicker copy. Author → kicker color override (#hex).
 * ═══════════════════════════════════════════════════════════════════════ */

const CHAT_CLUSTER_DEFAULTS = [
  { x: 0.04, y: 0.10, w: 0.56 },
  { x: 0.34, y: 0.26, w: 0.60 },
  { x: 0.04, y: 0.78, w: 0.62 },
];

function parseChatCluster(body) {
  if (!body) return [
    { side: 'in',  text: 'The website is open on my tabs all\nready for Sunday 🤣 💗\n❤️' },
    { side: 'in',  text: "What a deal. It's SO cute 👌🏼👌🏼💗💗\n❤️" },
    { side: 'in',  text: 'Wait is this free for orders over £75 on\nSunday? Cannot wait to fill it with my\nfave Monday muse products 😍\n❤️' },
  ];
  return body.split(/\n\n+/).map((chunk) => {
    const m = chunk.match(/^\s*(in|out)\s*[:|]\s*([\s\S]+)$/i);
    if (m) return { side: m[1].toLowerCase(), text: m[2].trim() };
    return { side: 'in', text: chunk.trim() };
  }).filter((b) => b.text).slice(0, 6);
}

function ChatBubble({ side, text }) {
  const isOut = side === 'out';
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }}>
      <div style={{
        background: isOut ? '#0a84ff' : '#fff',
        color: isOut ? '#fff' : '#000',
        padding: '18px 24px',
        borderRadius: 28,
        fontSize: 26, lineHeight: 1.32,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        boxShadow: '0 14px 40px rgba(0,0,0,.18), 0 4px 10px rgba(0,0,0,.08)',
        whiteSpace: 'pre-wrap',
        maxWidth: '100%',
      }}>
        {text}
      </div>
    </div>
  );
}

function LayoutUIChatCluster({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const bubbles = parseChatCluster(variation.body);
  const headline = variation.headline || "we're very grateful\nfor all the love it's\nreceived so far!";
  const headlineColor = variation.cta || '#fff';

  return (
    <>
      {/* Kicker */}
      {headline.trim() && (
        <DraggableBlock
          frac={pos.headline || { x: 0.50, y: 0.04 }}
          onChange={(p) => onPosChange('headline', p)}
          size={sizes.headline || { w: 0.46 }}
          onResize={(s) => onResize('headline', s)}
          frameW={F.w} frameH={F.h} editOn={editOn}
          widthFrac={(sizes.headline && sizes.headline.w) || 0.46}
          minWidthFrac={0.25} maxWidthFrac={0.8}
          handleLabel="Headline">
          <div style={{
            width: '100%',
            fontFamily: fontH2,
            fontSize: 44, lineHeight: 1.1, fontWeight: 500,
            color: headlineColor, letterSpacing: -0.5,
            textAlign: 'right', whiteSpace: 'pre-line',
            textShadow: '0 2px 12px rgba(0,0,0,.15)',
          }}>
            {headline}
          </div>
        </DraggableBlock>
      )}

      {/* Bubbles */}
      {bubbles.map((b, i) => {
        const role = `bubble${i}`;
        const def = CHAT_CLUSTER_DEFAULTS[i % CHAT_CLUSTER_DEFAULTS.length];
        const p = pos[role] || { x: def.x, y: def.y };
        const sz = sizes[role] || { w: def.w };
        return (
          <DraggableBlock
            key={role}
            frac={p} onChange={(np) => onPosChange(role, np)}
            size={sz} onResize={(ns) => onResize(role, ns)}
            frameW={F.w} frameH={F.h} editOn={editOn}
            widthFrac={sz.w} minWidthFrac={0.3} maxWidthFrac={0.85}
            handleLabel={`Bubble ${i + 1} · ${b.side}`}>
            <ChatBubble side={b.side} text={b.text} />
          </DraggableBlock>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  UI BEFORE / AFTER  (Pore-Favor style)
 *  Top half: side-by-side before / after image strip. Bottom half: stack
 *  of iMessage chat bubbles + product image.
 *
 *  Per-variation imagery uses the standard variation.id slot for the
 *  AFTER photo (cleaner skin / hero). The BEFORE photo lives in
 *  ImageStore[variation.id + '__before']. Product image uses the
 *  existing convention: ImageStore[variation.id + '__product'].
 *
 *  Body format — bubbles separated by blank lines:
 *      out: My skin is finally clear & 2025 just started! 🎉
 *      in:  Is this the supplement that treats acne at the root cause?? 🤔
 *      out: hell yeah!! 🔥
 * ═══════════════════════════════════════════════════════════════════════ */

function parseBABubbles(body) {
  if (!body) return [
    { side: 'out', text: 'My skin is finally clear & 2025\njust started! 🎉' },
    { side: 'in',  text: 'Is this the supplement that treats\nacne at the root cause?? 🤔' },
    { side: 'out', text: 'hell yeah!! 🔥' },
  ];
  return body.split(/\n\n+/).map((chunk) => {
    const m = chunk.match(/^\s*(in|out)\s*[:|]\s*([\s\S]+)$/i);
    if (m) return { side: m[1].toLowerCase(), text: m[2].trim() };
    return { side: 'out', text: chunk.trim() };
  }).filter((b) => b.text).slice(0, 6);
}

/* Lightweight image-upload tile that targets a custom ImageStore slot. */
function BAImageTile({ slotKey, label, editOn, style }) {
  // Re-render when ImageStore changes
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => window.ImageStore && window.ImageStore.subscribe(force), []);
  const img = window.ImageStore && window.ImageStore.get(slotKey);
  const fileRef = React.useRef(null);
  const onFile = (f) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = (e) => window.ImageStore.set(slotKey, e.target.result);
    r.readAsDataURL(f);
  };
  return (
    <div
      onClick={(e) => { if (!editOn) return; e.stopPropagation(); fileRef.current && fileRef.current.click(); }}
      onDragOver={(e) => { if (!editOn) return; e.preventDefault(); e.currentTarget.style.outline = '3px dashed #b58a54'; }}
      onDragLeave={(e) => { e.currentTarget.style.outline = 'none'; }}
      onDrop={(e) => { if (!editOn) return; e.preventDefault(); e.currentTarget.style.outline = 'none'; const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) onFile(f); }}
      style={{
        ...style,
        backgroundImage: img ? `url(${img})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        background: img ? `url(${img}) center/cover` : '#d8d3c6',
        cursor: editOn ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files[0])} />
      {!img && (
        <div style={{ color: 'rgba(40,30,20,.55)', fontSize: 22, fontWeight: 600, textAlign: 'center', padding: 20 }}>
          ↑<br />{label}
        </div>
      )}
    </div>
  );
}

function LayoutUIBeforeAfter({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const bubbles = parseBABubbles(variation.body);

  // Before & After are independently movable image tiles.
  const beforeSize = sizes.before || { w: 0.32 };
  const beforePos  = pos.before  || { x: 0.10, y: 0.06 };
  const afterSize  = sizes.after  || { w: 0.32 };
  const afterPos   = pos.after   || { x: 0.58, y: 0.06 };

  // Product image overlay.
  const prodSize = sizes.product || { w: 0.62 };
  const prodPos  = pos.product  || { x: 0.19, y: 0.66 };

  const beforeKey = variation.id + '__before';
  const afterKey  = variation.id + '__after';
  const productKey = variation.id + '__product';

  return (
    <>
      {/* Before tile */}
      <DraggableBlock
        frac={beforePos} onChange={(p) => onPosChange('before', p)}
        size={beforeSize} onResize={(s) => onResize('before', s)}
        frameW={F.w} frameH={F.h} editOn={editOn}
        widthFrac={beforeSize.w} minWidthFrac={0.15} maxWidthFrac={0.6}
        handleLabel="Before">
        <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 6, overflow: 'hidden',
          boxShadow: '0 14px 40px rgba(0,0,0,.18)' }}>
          <BAImageTile slotKey={beforeKey} label="BEFORE" editOn={editOn} style={{ width: '100%', height: '100%' }} />
        </div>
      </DraggableBlock>

      {/* After tile */}
      <DraggableBlock
        frac={afterPos} onChange={(p) => onPosChange('after', p)}
        size={afterSize} onResize={(s) => onResize('after', s)}
        frameW={F.w} frameH={F.h} editOn={editOn}
        widthFrac={afterSize.w} minWidthFrac={0.15} maxWidthFrac={0.6}
        handleLabel="After">
        <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 6, overflow: 'hidden',
          boxShadow: '0 14px 40px rgba(0,0,0,.18)' }}>
          <BAImageTile slotKey={afterKey} label="AFTER" editOn={editOn} style={{ width: '100%', height: '100%' }} />
        </div>
      </DraggableBlock>

      {/* Bubbles */}
      {bubbles.map((b, i) => {
        const role = `bubble${i}`;
        const def = { x: b.side === 'out' ? 0.30 : 0.06, y: 0.36 + i * 0.08, w: 0.50 };
        const p = pos[role] || { x: def.x, y: def.y };
        const sz = sizes[role] || { w: def.w };
        return (
          <DraggableBlock
            key={role}
            frac={p} onChange={(np) => onPosChange(role, np)}
            size={sz} onResize={(ns) => onResize(role, ns)}
            frameW={F.w} frameH={F.h} editOn={editOn}
            widthFrac={sz.w} minWidthFrac={0.25} maxWidthFrac={0.85}
            handleLabel={`Bubble ${i + 1} · ${b.side}`}>
            <ChatBubble side={b.side} text={b.text} />
          </DraggableBlock>
        );
      })}

      {/* Product overlay (uploadable, draggable) */}
      <DraggableBlock
        frac={prodPos} onChange={(p) => onPosChange('product', p)}
        size={prodSize} onResize={(s) => onResize('product', s)}
        frameW={F.w} frameH={F.h} editOn={editOn}
        widthFrac={prodSize.w} minWidthFrac={0.35} maxWidthFrac={0.95}
        handleLabel="Product">
        <BAImageTile slotKey={productKey} label="PRODUCT" editOn={editOn}
          style={{ width: '100%', aspectRatio: '5 / 4', borderRadius: 8 }} />
      </DraggableBlock>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  BEFORE / AFTER · COMPARISON ADS
 *  Three "us vs them" / before-vs-after style templates. Each renders
 *  a fixed scaffolded canvas (not draggable bubbles) — copy is fully
 *  editable via the Tweaks panel. Per-side imagery uses dedicated
 *  ImageStore slots: variation.id + '__left' / '__right' / '__hero'.
 *
 *  Body format — pipe-separated rows, blank line between sides where
 *  applicable:
 *      ba-split:       LEFT_BULLETS \n\n RIGHT_BULLETS  (one bullet/line)
 *      ba-checktable:  Title | Subtitle  per row
 *      ba-pillpair:    LEFT_ROWS \n\n RIGHT_ROWS  (one row/line)
 *
 *  variation.headline = top headline / kicker.
 *  variation.cta      = optional override for accent / secondary color.
 *  variation.author   = "left label | right label" (e.g. "Skincare | Them",
 *                       "without amble | with amble", "AllergyRx | Others").
 * ═══════════════════════════════════════════════════════════════════════ */

function parseSides(body, fallback) {
  if (!body || !body.trim()) return fallback;
  const [l = '', r = ''] = body.split(/\n\n+/);
  return [
    l.split(/\n/).map((s) => s.trim()).filter(Boolean),
    r.split(/\n/).map((s) => s.trim()).filter(Boolean),
  ];
}
function parseBALabels(author, fbL, fbR) {
  if (!author) return [fbL, fbR];
  const [l, r] = author.split('|').map((s) => (s || '').trim());
  return [l || fbL, r || fbR];
}

/* ───────── BA PORTRAIT CENTER ────────────────────────────────────────
   In portrait (9:16) frames, the BA layouts are designed for a 1:1
   canvas — letting them stretch to 1080x1920 looks bottom-heavy. This
   wrapper renders the design at the frame's WIDTH x WIDTH (a 1:1 square)
   centered vertically, and bleeds `bleedBg` to fill the top/bottom
   margins. In square mode, it's a no-op pass-through. */
function BAPortraitCenter({ F, bleedBg, children }) {
  // MANDATORY: in 9:16 (or any non-square) frames, render the design as
  // a centered 1:1 square with `bleedBg` filling top/bottom. This guarantees
  // the layout is centered for 1080x1920 ads and never stretches vertically.
  const isSquare = Math.abs(F.h - F.w) < 2;
  if (isSquare) return children;
  return (
    <div style={{
      width: '100%', height: '100%', background: bleedBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{ width: F.w, height: F.w, position: 'relative', flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ───────── BA SPLIT (yours / them) ──────────────────────────────────── */
function LayoutBASplit({ variation, F, frame, editOn, accent, fontStack, fontH2 }) {
  const [leftLabel, rightLabel] = parseBALabels(variation.author, 'Skincare', 'Them');
  const [leftRows, rightRows] = parseSides(variation.body, [
    ['Designed for you', 'Fuss-free', 'Clean & safe\ningredients'],
    ['One size fits all', 'Trial & error', 'Unknown\ningredients'],
  ]);
  const kicker = variation.headline || 'love from\nyours.';
  const bg = variation.bg || {};
  const leftBg  = bg.leftBg  || '#fbe4d8';
  const rightBg = bg.rightBg || '#cfd2eb';
  const leftFg  = bg.leftFg  || '#1a1f3d';
  const rightFg = bg.rightFg || '#1a1f3d';
  const badgeBg = bg.badge   || '#1a1f3d';
  const badgeFg = bg.badgeFg || '#ffffff';

  const leftKey  = variation.id + '__left';
  const rightKey = variation.id + '__right';

  const Bullet = ({ children, color, fs }) => (
    <div style={{ borderTop: `1.5px solid ${color}55`, padding: '24px 14px 0', textAlign: 'center',
      fontSize: fs, fontWeight: 600, lineHeight: 1.22, color, whiteSpace: 'pre-line', minHeight: 88 }}>
      {children}
    </div>
  );

  // Aspect-aware: 1:1 vs 9:16
  const tall = false; // Always square — BAPortraitCenter wraps 9:16 in a centered 1:1 square.
  const PAD_X = tall ? 56 : 40;
  const PAD_TOP = tall ? 80 : 50;
  const PAD_BOT = tall ? 80 : 44;
  const KICK_FS = tall ? 38 : 30;
  const LABEL_FS = tall ? 78 : 56;
  const BULLET_FS = tall ? 30 : 26;       // body — never below 26
  const BADGE = tall ? 90 : 72;
  const VS_FS = tall ? 28 : 22;

  return (
    <BAPortraitCenter F={F} bleedBg={`linear-gradient(180deg, ${leftBg} 0%, ${leftBg} 50%, ${rightBg} 50%, ${rightBg} 100%)`}>
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr',
      fontFamily: fontStack, position: 'relative' }}>
      {/* LEFT */}
      <div style={{ background: leftBg, display: 'flex', flexDirection: 'column',
        padding: `${PAD_TOP}px ${PAD_X}px ${PAD_BOT}px ${PAD_X}px` }}>
        <div style={{ fontFamily: fontH2, fontSize: KICK_FS, lineHeight: 0.95, color: leftFg, fontStyle: 'italic',
          fontWeight: 400, marginBottom: -2 }}>
          {kicker.split('\n')[0]}
        </div>
        <div style={{ fontFamily: fontH2, fontSize: LABEL_FS, lineHeight: 1, color: leftFg, fontWeight: 600,
          letterSpacing: -1.2, marginBottom: 24 }}>
          {leftLabel}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <BAImageTile slotKey={leftKey} label="LEFT PRODUCT" editOn={editOn}
            style={{ width: '100%', height: '100%', background: 'transparent' }} />
        </div>
        <div style={{ paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {(leftRows.length ? leftRows : ['—']).slice(0, 4).map((r, i) => <Bullet key={i} color={leftFg} fs={BULLET_FS}>{r}</Bullet>)}
        </div>
      </div>
      {/* RIGHT */}
      <div style={{ background: rightBg, display: 'flex', flexDirection: 'column',
        padding: `${PAD_TOP}px ${PAD_X}px ${PAD_BOT}px ${PAD_X}px` }}>
        <div style={{ fontFamily: fontH2, fontSize: LABEL_FS, lineHeight: 1, color: rightFg, fontWeight: 700,
          letterSpacing: -1.2, marginBottom: 24, marginTop: KICK_FS + 2, textAlign: 'left' }}>
          {rightLabel}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <BAImageTile slotKey={rightKey} label="RIGHT PRODUCT" editOn={editOn}
            style={{ width: '100%', height: '100%', background: 'transparent' }} />
        </div>
        <div style={{ paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {(rightRows.length ? rightRows : ['—']).slice(0, 4).map((r, i) => <Bullet key={i} color={rightFg} fs={BULLET_FS}>{r}</Bullet>)}
        </div>
      </div>
      {/* VS badge */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: BADGE, height: BADGE, borderRadius: '50%', background: badgeBg, color: badgeFg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: fontH2, fontStyle: 'italic', fontSize: VS_FS, fontWeight: 500,
        boxShadow: '0 6px 20px rgba(0,0,0,.18)' }}>vs.</div>
    </div>
    </BAPortraitCenter>
  );
}

/* ───────── BA CHECK TABLE (AllergyRx Difference) ────────────────────── */
function LayoutBACheckTable({ variation, F, frame, editOn, accent, fontStack, fontH2 }) {
  const [brandLabel, otherLabel] = parseBALabels(variation.author, 'AllergyRx', 'OTHERS');
  const headline = variation.headline || 'The AllergyRx\nDifference';
  // body rows: "TITLE | description"
  const rows = (variation.body || [
    'TARGETED TREATMENT | Custom ingredients to address your complete symptom profile.',
    'PRECISION CUSTOM DOSING | Each formula is carefully balanced to match your specific needs.',
    'CONTINUED ADAPTIVE CARE | Your treatment evolves with you as seasonal changes affect your allergies.',
    'SHORT & LONG-TERM RELIEF | Complete symptom management that works now and over time.',
  ].join('\n')).split(/\n+/).map((r) => {
    const [t, d] = r.split('|').map((s) => (s || '').trim());
    return { t: t || '', d: d || '' };
  }).filter((r) => r.t || r.d).slice(0, 5);

  const heroKey = variation.id + '__hero';
  const bg = variation.bg || {};
  const pageBg     = bg.pageBg     || '#f7f4ed';
  const dark       = bg.headline   || accent || '#1d3a30';
  const colBg      = bg.brandCol   || '#e7efe9';
  const checkBg    = bg.checkBg    || dark;
  const checkFg    = bg.checkFg    || '#ffffff';

  // Aspect-aware sizing. The layout has to fit a 1080-square canvas
  // (tight) AND a 1080×1920 portrait canvas (loose). We tune density.
  const tall = false; // Always square — BAPortraitCenter wraps 9:16 in a centered 1:1 square.          // 9:16-ish
  const visibleRows = tall ? rows : rows.slice(0, 3);
  const PAD = tall ? 110 : 80;            // outer (Meta safe-zone friendly)
  const HL_SIZE = tall ? 96 : 64;         // headline
  const HL_GAP = tall ? 60 : 36;
  const COL_W = tall ? 200 : 150;
  const ROW_PAD_Y = tall ? '36px 0 32px' : '22px 0 20px';
  const TITLE_FS = tall ? 24 : 20;
  const DESC_FS  = tall ? 28 : 26;        // body — never below 26
  const HEAD_FS  = tall ? 26 : 22;
  const CHECK_BOX = tall ? 84 : 60;
  const CHECK_FS  = tall ? 48 : 34;
  const X_FS = tall ? 64 : 44;
  const HERO_AR = tall ? '1 / 1.0' : '1 / 0.9';

  return (
    <BAPortraitCenter F={F} bleedBg={pageBg}>
    <div style={{ width: '100%', height: '100%', background: pageBg, fontFamily: fontStack,
      display: 'flex', flexDirection: 'column', padding: PAD, boxSizing: 'border-box', overflow: 'hidden', gap: tall ? 36 : 24 }}>
      {/* Headline */}
      <div style={{ fontFamily: fontH2, fontSize: HL_SIZE, lineHeight: 1.0, fontWeight: 600, color: dark,
        letterSpacing: -2, whiteSpace: 'pre-line' }}>
        {headline}
      </div>
      {/* Hero image — full width, prominent */}
      <div style={{ width: '100%', flex: tall ? '0 0 38%' : '0 0 28%', minHeight: 0,
        background: colBg, borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BAImageTile slotKey={heroKey} label="HERO" editOn={editOn}
          style={{ width: '100%', height: '100%', background: 'transparent' }} />
      </div>
      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: `1fr ${COL_W}px ${COL_W}px`, columnGap: 24, alignItems: 'stretch' }}>
        {/* Header row */}
        <div></div>
        <div style={{ background: colBg, borderTopLeftRadius: 10, borderTopRightRadius: 10,
          padding: '18px 0', textAlign: 'center', fontSize: HEAD_FS, color: dark, fontWeight: 600, letterSpacing: .3 }}>
          {brandLabel}
        </div>
        <div style={{ padding: '18px 0', textAlign: 'center', fontSize: HEAD_FS, color: '#7a7a7a',
          fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {otherLabel}
        </div>

        {/* Feature rows */}
        {visibleRows.map((r, i) => {
          const isLast = i === visibleRows.length - 1;
          return (
            <React.Fragment key={i}>
              <div style={{ padding: ROW_PAD_Y, borderTop: '1.5px solid #d8d3c6',
                display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: TITLE_FS, fontWeight: 700, color: dark, letterSpacing: 1,
                  textTransform: 'uppercase', marginBottom: 6 }}>{r.t}</div>
                <div style={{ fontSize: DESC_FS, color: '#222', lineHeight: 1.32 }}>{r.d}</div>
              </div>
              <div style={{ background: colBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, borderBottomLeftRadius: isLast ? 10 : 0, borderBottomRightRadius: isLast ? 10 : 0 }}>
                <div style={{ width: CHECK_BOX, height: CHECK_BOX, background: checkBg, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: checkFg, fontSize: CHECK_FS, fontWeight: 700 }}>✓</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderTop: '1.5px solid #d8d3c6', color: '#bbb', fontSize: X_FS, fontWeight: 300 }}>×</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
    </BAPortraitCenter>
  );
}

/* ───────── BA PILL PAIR (amble GLP-1) ───────────────────────────────── */
function LayoutBAPillPair({ variation, F, frame, editOn, accent, fontStack, fontH2 }) {
  const [leftLabel, rightLabel] = parseBALabels(variation.author, 'without amble', 'with amble');
  const [leftRows, rightRows] = parseSides(variation.body, [
    ['Hidden fees', 'No support', 'Price increases per dose'],
    ['Transparent pricing', 'Personalized Daily Support', 'Same price at every dose'],
  ]);
  const headline = variation.headline || 'Why is amble the\nright choice for\n*compounded GLP-1*';
  const heroKey = variation.id + '__hero';
  const bg = variation.bg || {};
  const pageBg     = bg.pageBg     || '#f3a13a';
  const glow       = bg.glow       || 'rgba(255,210,140,.45)';
  const headlineFg = bg.headlineFg || '#ffffff';
  const dimCardBg  = bg.dimCardBg  || 'rgba(255,250,235,.85)';
  const liveCardBg = bg.liveCardBg || '#ffffff';
  const cardFg     = bg.cardFg     || '#2a1a05';

  // Render headline with *italic* support
  const renderHL = (s) => s.split('\n').map((line, li) => (
    <div key={li}>
      {line.split(/(\*[^*]+\*)/g).map((seg, i) =>
        seg.startsWith('*') && seg.endsWith('*') ?
          <em key={i} style={{ fontStyle: 'italic', fontWeight: 400 }}>{seg.slice(1, -1)}</em> :
          <span key={i}>{seg}</span>
      )}
    </div>
  ));

  // Bold the second word in labels (mimics "without **amble**")
  const renderLabel = (s) => {
    const parts = (s || '').split(' ');
    if (parts.length < 2) return <span style={{ fontWeight: 500 }}>{s}</span>;
    const last = parts.pop();
    return (
      <>
        <span style={{ fontWeight: 400 }}>{parts.join(' ')} </span>
        <span style={{ fontWeight: 700 }}>{last}</span>
      </>
    );
  };

  // Aspect-aware sizing for 1:1 vs 9:16
  const tall = false; // Always square — BAPortraitCenter wraps 9:16 in a centered 1:1 square.
  const PAD = tall ? 100 : 70;
  const HL_SIZE = tall ? 92 : 60;
  const HL_GAP  = tall ? 56 : 30;
  const CARD_PAD = tall ? '32px 24px' : '22px 18px';
  const LABEL_FS = tall ? 42 : 32;
  const LABEL_PAD = tall ? '16px 0 30px' : '10px 0 20px';
  const ROW_FS = tall ? 30 : 26;          // body — never below 26
  const ROW_PAD = tall ? '24px 6px' : '18px 6px';
  const CARDS_GAP_BOTTOM = tall ? 44 : 28;

  return (
    <BAPortraitCenter F={F} bleedBg={pageBg}>
    <div style={{ width: '100%', height: '100%', background: pageBg,
      fontFamily: fontStack, display: 'flex', flexDirection: 'column',
      padding: `${PAD}px ${PAD}px 0`, boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden' }}>
      {/* Soft gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, ${glow}, transparent 65%)`, pointerEvents: 'none' }} />
      {/* Headline */}
      <div style={{ fontFamily: fontH2, fontSize: HL_SIZE, lineHeight: 1.05, fontWeight: 500,
        color: headlineFg, letterSpacing: -1.5, textAlign: 'center', whiteSpace: 'pre-line',
        textShadow: '0 2px 16px rgba(0,0,0,.12)', marginBottom: HL_GAP, position: 'relative' }}>
        {renderHL(headline)}
      </div>
      {/* Two pill cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: CARDS_GAP_BOTTOM, position: 'relative' }}>
        {[{ label: leftLabel, rows: leftRows, dim: true },
          { label: rightLabel, rows: rightRows, dim: false }].map((side, idx) => (
          <div key={idx} style={{ background: side.dim ? dimCardBg : liveCardBg,
            borderRadius: 22, padding: CARD_PAD, display: 'flex', flexDirection: 'column',
            boxShadow: side.dim ? 'none' : '0 12px 32px rgba(0,0,0,.08)' }}>
            <div style={{ fontFamily: fontH2, fontSize: LABEL_FS, color: cardFg, textAlign: 'center',
              padding: LABEL_PAD, borderBottom: '1.5px solid rgba(0,0,0,.08)', marginBottom: 6,
              letterSpacing: -.5 }}>
              {renderLabel(side.label)}
            </div>
            {(side.rows.length ? side.rows : ['—']).slice(0, 4).map((r, i, arr) => (
              <div key={i} style={{ padding: ROW_PAD, textAlign: 'center', fontSize: ROW_FS,
                color: cardFg, fontWeight: 500, lineHeight: 1.28,
                borderBottom: i < arr.length - 1 ? '1.5px solid rgba(0,0,0,.08)' : 'none' }}>{r}</div>
            ))}
          </div>
        ))}
      </div>
      {/* Hero photo */}
      <div style={{ flex: 1, minHeight: 0, marginTop: 'auto', position: 'relative', paddingBottom: PAD * 0.4 }}>
        <BAImageTile slotKey={heroKey} label="HERO PRODUCT" editOn={editOn}
          style={{ width: '100%', height: '100%', background: 'transparent' }} />
      </div>
    </div>
    </BAPortraitCenter>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  PROBLEM / SOLUTION AD TYPE
 *  Two layouts: Split (your problems | our solution)  and  Search (the
 *  search query → the solution product). Both use a single product image.
 *  Body: newline-separated problem bullets (Split only). Headline: kicker
 *  for Solution side or search query for Search.
 * ═══════════════════════════════════════════════════════════════════════ */

function parsePSProblems(body) {
  if (!body) return [
    'Dehydrated, dull skin',
    'Clogged pores & impurities',
    'Too many steps',
    'No real results',
    'Not enough time',
  ];
  return body.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
}

/* --- PS SPLIT — "your problems" | "our solution" -------------------- */
function LayoutPSSplit({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const problems = parsePSProblems(variation.body);
  const solnLabel = variation.headline || 'Our\nsolution';
  const probLabel = variation.author   || 'Your\nproblems';

  const bg = variation.bg || {};
  const pageBg     = bg.pageBg     || '#ffffff';
  const accentRed  = bg.accentRed  || '#e6322a';
  const ink        = bg.ink        || '#13100c';
  const bubbleBg   = bg.bubbleBg   || '#e8e6e3';
  const bubbleFg   = bg.bubbleFg   || '#13100c';
  const dividerCol = bg.divider    || 'rgba(19,16,12,.18)';

  const heroKey = variation.id + '__hero';

  // 9:16 needs more breathing room; 1:1 is denser
  const tall = F.h > F.w * 1.2;
  const PAD       = tall ? 80 : 60;
  const TITLE_SZ  = tall ? 130 : 110;
  const TITLE_LH  = 0.92;
  const BUBBLE_FS = tall ? 32 : 28;
  const COL_GAP   = tall ? 60 : 40;
  // After-H1 spacing — bumped so the title breathes before the bubble list / hero
  const GAP_AFTER_H1 = tall ? 140 : 90;

  // For 9:16, center the 1:1-style two-column content vertically inside the canvas
  const innerHeight = tall ? F.w : F.h; // mirror 1:1 dimensions inside 9:16
  const verticalOffset = tall ? Math.max(0, (F.h - innerHeight) / 2) : 0;

  return (
    <div style={{ width: '100%', height: '100%', background: pageBg, position: 'relative',
      fontFamily: fontStack, overflow: 'hidden' }}>
      {/* Center divider */}
      <div style={{ position: 'absolute', left: '50%',
        top: verticalOffset + PAD * 1.2,
        bottom: verticalOffset + PAD * 1.2,
        width: 2, background: dividerCol, transform: 'translateX(-1px)' }} />

      {/* Two-column grid — wrapped in a vertically-centered band on 9:16 */}
      <div style={{ position: 'absolute', left: 0, right: 0,
        top: verticalOffset, height: innerHeight,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: COL_GAP,
        boxSizing: 'border-box', padding: `${PAD}px ${PAD * 0.8}px` }}>

        {/* ─── LEFT: PROBLEMS ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <h2 style={{ fontFamily: fontH2, fontSize: TITLE_SZ, lineHeight: TITLE_LH,
            fontWeight: 800, margin: 0, letterSpacing: -3, whiteSpace: 'pre-line',
            color: ink }}>
            {probLabel.split('\n').map((line, i) => (
              <span key={i} style={{ display: 'block',
                color: i === probLabel.split('\n').length - 1 ? accentRed : ink }}>
                {line}
              </span>
            ))}
          </h2>
          {/* Bubble list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: tall ? 28 : 22,
            marginTop: GAP_AFTER_H1, alignItems: 'flex-start' }}>
            {problems.map((p, i) => {
              // Stagger horizontally so it feels organic
              const stagger = [0, 32, 12, 64, 24][i % 5];
              return (
                <div key={i} style={{ position: 'relative', marginLeft: stagger,
                  background: bubbleBg, color: bubbleFg,
                  padding: '18px 28px', borderRadius: 26,
                  fontSize: BUBBLE_FS, fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  boxShadow: '0 6px 16px rgba(0,0,0,.05)', maxWidth: '100%' }}>
                  {p}
                  {/* Tail */}
                  <span style={{ position: 'absolute', left: 22, bottom: -4,
                    width: 14, height: 14, borderRadius: '50%', background: bubbleBg }} />
                  <span style={{ position: 'absolute', left: 14, bottom: -10,
                    width: 8, height: 8, borderRadius: '50%', background: bubbleBg }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT: SOLUTION ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Title with hand-drawn ellipse around the second word */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <h2 style={{ fontFamily: fontH2, fontSize: TITLE_SZ, lineHeight: TITLE_LH,
              fontWeight: 800, margin: 0, letterSpacing: -3, whiteSpace: 'pre-line',
              color: ink, position: 'relative', display: 'inline-block' }}>
              {solnLabel.split('\n').map((line, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <span key={i} style={{ display: 'block', position: 'relative' }}>
                    {line}
                    {isLast && (
                      <svg viewBox="0 0 360 130" preserveAspectRatio="none"
                        style={{ position: 'absolute', left: -18, right: -18, top: -12,
                          width: 'calc(100% + 36px)', height: 'calc(100% + 24px)',
                          pointerEvents: 'none' }}>
                        <ellipse cx="180" cy="65" rx="170" ry="56"
                          fill="none" stroke={accentRed} strokeWidth="6"
                          strokeLinecap="round" transform="rotate(-3 180 65)" />
                        <ellipse cx="180" cy="65" rx="166" ry="52"
                          fill="none" stroke={accentRed} strokeWidth="3"
                          strokeLinecap="round" opacity="0.55" transform="rotate(-2 180 65)" />
                      </svg>
                    )}
                  </span>
                );
              })}
            </h2>
          </div>
          {/* Hero product image */}
          <div style={{ flex: 1, marginTop: GAP_AFTER_H1, display: 'flex',
            alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            <BAImageTile slotKey={heroKey} label="PRODUCT"
              editOn={editOn}
              style={{ width: '100%', height: '100%', background: 'transparent' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- PS SEARCH — "the search:" → "the solution:" -------------------- */
function LayoutPSSearch({ variation, pos, sizes, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const query    = variation.body     || 'how to stop dry flaky skin';
  const searchLb = variation.headline || 'the search:';
  const solnLb   = variation.author   || 'the solution:';

  const bg = variation.bg || {};
  const pageBg   = bg.pageBg   || '#eceae6';
  const ink      = bg.ink      || '#13100c';
  const accentRed = bg.accentRed || '#e6322a';
  const inputBg  = bg.inputBg  || '#ffffff';
  const inputFg  = bg.inputFg  || '#13100c';
  const inputPh  = bg.inputPh  || '#13100c';

  const heroKey = variation.id + '__hero';

  const tall = F.h > F.w * 1.2;
  const PAD       = tall ? 100 : 70;
  const LABEL_SZ  = tall ? 86 : 72;
  const QUERY_SZ  = tall ? 50 : 42;
  // Bumped post-H1 spacing so the title breathes
  const GAP_AFTER_LABEL = tall ? 60 : 44;
  const GAP_AFTER_BAR   = tall ? 130 : 90;
  const GAP_AFTER_SOLN  = tall ? 90 : 60;

  // Center the 1:1-style content vertically inside the 9:16 canvas
  const innerHeight = tall ? F.w : F.h;
  const verticalOffset = tall ? Math.max(0, (F.h - innerHeight) / 2) : 0;

  return (
    <div style={{ width: '100%', height: '100%', background: pageBg, position: 'relative',
      fontFamily: fontStack, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0,
        top: verticalOffset, height: innerHeight,
        display: 'flex', flexDirection: 'column',
        padding: `${PAD * 0.9}px ${PAD}px`, boxSizing: 'border-box' }}>

      {/* "the search:" label */}
      <div style={{ fontFamily: fontH2, fontSize: LABEL_SZ, fontWeight: 800,
        color: accentRed, letterSpacing: -2.4, textAlign: 'center',
        marginTop: tall ? PAD * 0.2 : 0 }}>
        {searchLb}
      </div>

      {/* Fake search bar */}
      <div style={{ marginTop: GAP_AFTER_LABEL, display: 'flex', alignItems: 'center',
        gap: 18, background: inputBg, borderRadius: 18,
        padding: `${tall ? 28 : 22}px ${tall ? 36 : 28}px`,
        boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
        <svg width={QUERY_SZ * 0.85} height={QUERY_SZ * 0.85} viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="#9c9994" strokeWidth="2.2" />
          <path d="M16 16l4 4" stroke="#9c9994" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <div style={{ fontFamily: fontStack, fontSize: QUERY_SZ, color: inputFg,
          fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.1, flex: 1 }}>
          {query}
        </div>
      </div>

      {/* "the solution:" label */}
      <div style={{ fontFamily: fontH2, fontSize: LABEL_SZ, fontWeight: 800,
        color: accentRed, letterSpacing: -2.4, textAlign: 'center',
        marginTop: GAP_AFTER_BAR }}>
        {solnLb}
      </div>

      {/* Hero product image */}
      <div style={{ flex: 1, minHeight: 0, marginTop: GAP_AFTER_SOLN,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BAImageTile slotKey={heroKey} label="PRODUCT"
          editOn={editOn}
          style={{ width: '100%', height: '100%', background: 'transparent' }} />
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  REGISTRY — maps each layout id to its component
 * ═══════════════════════════════════════════════════════════════════════ */

window.ADTYPE_LAYOUTS = {
  // DM
  'dm-instagram': LayoutDMInstagram,
  'dm-imessage':  LayoutDMiMessage,
  'dm-whatsapp':  LayoutDMWhatsApp,
  'dm-sms':       LayoutDMSMS,
  // Review
  'review-bubble':   LayoutReviewBubble,
  'review-stars':    LayoutReviewStars,
  'review-polaroid': LayoutReviewPolaroid,
  // UI
  'ui-airdrop':      LayoutUIAirDrop,
  'ui-notification': LayoutUINotification,
  'ui-composer':     LayoutUIComposer,
  'ui-review-cluster': LayoutUIReviewCluster,
  'ui-chat-cluster':   LayoutUIChatCluster,
  'ui-before-after':   LayoutUIBeforeAfter,
  // Labelled
  'labelled-bubbles': LayoutLabelledBubbles,
  // Problem / Solution
  'ps-split':  LayoutPSSplit,
  'ps-search': LayoutPSSearch,
  // Before/After (comparison)
  'ba-split':       LayoutBASplit,
  'ba-checktable':  LayoutBACheckTable,
  'ba-pillpair':    LayoutBAPillPair,
};

window.ADTYPE_LAYOUT_LIST = {
  testimonial: ['card', 'editorial', 'tabbed'],
  dm:          ['dm-instagram', 'dm-imessage', 'dm-whatsapp', 'dm-sms'],
  review:      ['review-bubble', 'review-stars', 'review-polaroid'],
  ui:          ['ui-airdrop', 'ui-notification', 'ui-composer', 'ui-review-cluster', 'ui-chat-cluster', 'ui-before-after'],
  labelled:    ['labelled-bubbles'],
  problemsolution: ['ps-split', 'ps-search'],
  beforeafter: ['ba-split', 'ba-checktable', 'ba-pillpair'],
};

window.ADTYPE_LAYOUT_LABELS = {
  'card': 'Card', 'editorial': 'Editorial', 'tabbed': 'Tabbed',
  'dm-instagram': 'Instagram DM', 'dm-imessage': 'iMessage', 'dm-whatsapp': 'WhatsApp', 'dm-sms': 'SMS',
  'review-bubble': 'Bubble review', 'review-stars': 'Star card', 'review-polaroid': 'Polaroid',
  'ui-airdrop': 'AirDrop', 'ui-notification': 'Notification', 'ui-composer': 'iMessage composer',
  'ui-review-cluster': 'Review cluster', 'ui-chat-cluster': 'Chat cluster', 'ui-before-after': 'Before / After',
  'labelled-bubbles': 'Bubble callouts',
  'ps-split': 'Problems / Solution', 'ps-search': 'Search → Solution',
  'ba-split': 'Side-by-side', 'ba-checktable': 'Check table', 'ba-pillpair': 'Pill pair',
};

window.ADTYPE_DEFAULT_LAYOUT = {
  testimonial: 'card',
  dm: 'dm-instagram',
  review: 'review-bubble',
  ui: 'ui-airdrop',
  labelled: 'labelled-bubbles',
  problemsolution: 'ps-split',
  beforeafter: 'ba-split',};

// Layouts that DON'T use the main per-variation background image — they
// manage their own image slots (BAImageTile). Suppresses the AdFrame
// upload overlay so it doesn't block the scaffolded layout.
window.LAYOUTS_NO_MAIN_IMAGE = {
  'ui-before-after': true,
  'ba-split': true,
  'ba-checktable': true,
  'ba-pillpair': true,
  'ps-split': true,
  'ps-search': true,
};

// Per-layout color slot registry. Each entry is { key, label, default }.
// The Tweaks panel renders a color picker for each slot when the active
// layout has slots defined here. Values are stored in variation.bg[key].
window.LAYOUT_COLOR_SLOTS = {
  'ba-split': [
    { key: 'leftBg',   label: 'Left background',  default: '#fbe4d8' },
    { key: 'rightBg',  label: 'Right background', default: '#cfd2eb' },
    { key: 'leftFg',   label: 'Left text',        default: '#1a1f3d' },
    { key: 'rightFg',  label: 'Right text',       default: '#1a1f3d' },
    { key: 'badge',    label: 'vs. badge',        default: '#1a1f3d' },
    { key: 'badgeFg',  label: 'vs. badge text',   default: '#ffffff' },
  ],
  'ba-checktable': [
    { key: 'pageBg',   label: 'Page background',  default: '#f7f4ed' },
    { key: 'brandCol', label: 'Brand column',     default: '#e7efe9' },
    { key: 'headline', label: 'Headline / dark',  default: '#1d3a30' },
    { key: 'checkBg',  label: 'Check tile',       default: '#1d3a30' },
    { key: 'checkFg',  label: 'Check mark',       default: '#ffffff' },
  ],
  'ps-split': [
    { key: 'pageBg',    label: 'Page background', default: '#ffffff' },
    { key: 'accentRed', label: 'Accent (titles)', default: '#e6322a' },
    { key: 'ink',       label: 'Ink / dark text', default: '#13100c' },
    { key: 'bubbleBg',  label: 'Bubble fill',     default: '#e8e6e3' },
    { key: 'bubbleFg',  label: 'Bubble text',     default: '#13100c' },
    { key: 'divider',   label: 'Divider line',    default: 'rgba(19,16,12,.18)' },
  ],
  'ps-search': [
    { key: 'pageBg',  label: 'Page background', default: '#eceae6' },
    { key: 'ink',     label: 'Headings',        default: '#13100c' },
    { key: 'accentRed', label: 'Headings accent (red)', default: '#e6322a' },
    { key: 'inputBg', label: 'Search bar fill', default: '#ffffff' },
    { key: 'inputFg', label: 'Query text',      default: '#13100c' },
  ],
  'ba-pillpair': [
    { key: 'pageBg',     label: 'Background',       default: '#f3a13a' },
    { key: 'glow',       label: 'Glow tint',        default: 'rgba(255,210,140,.45)' },
    { key: 'headlineFg', label: 'Headline text',    default: '#ffffff' },
    { key: 'dimCardBg',  label: '"Without" card',   default: 'rgba(255,250,235,.85)' },
    { key: 'liveCardBg', label: '"With" card',      default: '#ffffff' },
    { key: 'cardFg',     label: 'Card text',        default: '#2a1a05' },
  ],
};

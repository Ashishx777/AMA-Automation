/*
 * Three social-proof layouts, each receiving:
 *   variation { id, layout, headline, body, author, rating, cta, pos }
 *   pos       — drag positions for THIS layout + frame only
 *   F         — {w,h,label,previewW}
 *   frame     — 'square' | 'story'
 *   editOn    — bool
 *   onPosChange(role, fracPos) — persists drag
 *   accent    — brand accent color
 *   fontStack — display serif for this brand
 *
 * All text sizes are in frame-pixel units (the whole thing is CSS-scaled by the
 * host). Keep frame minimums: ≥28px for body text at 1080 wide.
 */

/* Reusable person silhouette avatar for testimonial author blocks. */
const PersonAvatar = ({ size = 44, bg = 'rgba(0,0,0,.08)', color = 'rgba(0,0,0,.55)' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.6" fill={color} />
      <path d="M4.5 20.5c0-4 3.4-6.8 7.5-6.8s7.5 2.8 7.5 6.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

const Stars = ({ rating = 5, size = 36, color = '#d4a857', trail = 'rgba(0,0,0,.12)' }) => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const fill = Math.max(0, Math.min(1, rating - i));
    out.push(
      <span key={i} style={{
        position: 'relative', display: 'inline-block',
        width: size, height: size, lineHeight: 1,
        marginRight: size * 0.08,
      }}>
        <span style={{ position: 'absolute', inset: 0, color: trail, fontSize: size, lineHeight: 1 }}>★</span>
        <span style={{ position: 'absolute', inset: 0, color, fontSize: size, lineHeight: 1,
          overflow: 'hidden', width: `${fill * 100}%` }}>★</span>
      </span>
    );
  }
  return <div style={{ display: 'inline-flex', alignItems: 'center' }}>{out}</div>;
};

/* ───── Layout A · Card Review ──────────────────────────────────────────── */
/* Floating white card with rounded corners, stars, bold headline, body, author.
   Inspired by the Terrapy screenshot. Clean, most restrained. */
function LayoutCard({ variation, pos, sizes = {}, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const isStory = frame === 'story';
  const cardPad = isStory ? 64 : 56;
  const widthFrac = isStory ? 0.88 : 0.84;

  return (
    <DraggableBlock
      frac={pos.card} frameW={F.w} frameH={F.h} editOn={editOn}
      handleLabel="★" widthFrac={widthFrac}
      size={sizes.card}
      onResize={onResize ? (s)=>onResize('card', s) : undefined}
      onChange={(p)=>onPosChange('card', p)}>
      <div style={{
        background: '#ffffff',
        borderRadius: 28,
        padding: `${cardPad}px ${cardPad}px ${cardPad - 8}px`,
        boxShadow: '0 6px 30px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.06)',
        color: accent,
      }}>
        <div style={{ marginBottom: 28 }}>
          <Stars rating={variation.rating} size={42} />
        </div>
        {variation.headline && (
          <div style={{
            fontFamily: fontStack,
            fontSize: isStory ? 72 : 64,
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: -1.2,
            marginBottom: 24,
            textWrap: 'pretty',
          }}>
            {variation.headline}
          </div>
        )}
        {variation.body && (
          <div style={{
            fontFamily: fontH2 || '"Geist", -apple-system, system-ui, sans-serif',
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.42,
            color: 'rgba(0,0,0,.62)',
            letterSpacing: -0.2,
            textWrap: 'pretty',
            marginBottom: variation.author ? 36 : 0,
          }}>
            {variation.body}
          </div>
        )}
        {variation.author && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingTop: 22, borderTop: '1px solid rgba(0,0,0,.08)',
          }}>
            <PersonAvatar size={44} bg="rgba(0,0,0,.06)" color="rgba(0,0,0,.5)" />
            <div style={{
              fontFamily: fontH2 || '"Geist", -apple-system, system-ui, sans-serif',
              fontSize: 26, fontWeight: 500, letterSpacing: -0.1,
              color: 'rgba(0,0,0,.7)',
            }}>{variation.author}</div>
          </div>
        )}
      </div>
    </DraggableBlock>
  );
}

/* ───── Layout B · Editorial Quote ──────────────────────────────────────── */
/* Big serif quote floating over image + stars below. Optional CTA pill near bottom.
   Inspired by the Luxury sunscreen ref. */
function LayoutEditorial({ variation, pos, sizes = {}, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {
  const isStory = frame === 'story';
  return (
    <>
      <DraggableBlock
        frac={pos.quote} frameW={F.w} frameH={F.h} editOn={editOn}
        handleLabel="❝" widthFrac={0.88}
        size={sizes.quote}
        onResize={onResize ? (s)=>onResize('quote', s) : undefined}
        onChange={(p)=>onPosChange('quote', p)}>
        <div style={{ color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,.35)' }}>
          {/* Per-variation override: ss1 (Solved Skin v1) gets an accent-colored
              pull-quote mark above the headline. */}
          {variation.id === 'ss1' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 88, height: 88, borderRadius: '50%',
              background: accent, color: '#fff',
              fontFamily: fontStack, fontSize: 110, lineHeight: 0.6,
              marginBottom: 24, paddingTop: 18,
              boxShadow: '0 8px 30px rgba(0,0,0,.18)',
              textShadow: 'none',
            }}>“</div>
          )}
          <div style={{
            fontFamily: fontStack,
            fontSize: isStory ? 108 : 88,
            fontWeight: 400,
            lineHeight: 1.02,
            letterSpacing: -2.4,
            textWrap: 'pretty',
          }}>
            {variation.headline ? `“${variation.headline}”` : ''}
          </div>
          {variation.body && (
            <div style={{
              fontFamily: fontH2 || '"Geist", -apple-system, system-ui, sans-serif',
              fontSize: 30, fontWeight: 400, lineHeight: 1.4,
              marginTop: 28, opacity: .92, letterSpacing: -0.2,
              textWrap: 'pretty',
            }}>{variation.body}</div>
          )}
          <div style={{ marginTop: 36 }}>
            <Stars rating={variation.rating} size={48} color="#f2c969" trail="rgba(255,255,255,.22)" />
          </div>
          {variation.author && (
            <div style={{
              marginTop: 24,
              fontFamily: fontH2 || '"Geist", -apple-system, system-ui, sans-serif',
              fontSize: 26, fontWeight: 500, letterSpacing: 0.8,
              textTransform: 'uppercase', opacity: .85,
            }}>— {variation.author}</div>
          )}
        </div>
      </DraggableBlock>

      {variation.cta && (
        <DraggableBlock
          frac={pos.cta} frameW={F.w} frameH={F.h} editOn={editOn}
          handleLabel="→" widthFrac={0.76}
          size={sizes.cta}
          onResize={onResize ? (s)=>onResize('cta', s) : undefined}
          onChange={(p)=>onPosChange('cta', p)}>
          <div style={{
            background: accent,
            color: '#fff',
            padding: '26px 44px',
            textAlign: 'center',
            fontFamily: fontH2 || '"Geist", -apple-system, system-ui, sans-serif',
            fontSize: 30, fontWeight: 500, letterSpacing: 2,
            textTransform: 'uppercase',
            boxShadow: '0 8px 30px rgba(0,0,0,.25)',
          }}>{variation.cta}</div>
        </DraggableBlock>
      )}
    </>
  );
}

/* ───── Layout C · Tabbed Testimonial ───────────────────────────────────── */
/* Sidebar-ish product card (draggable) + main testimonial tab with stars +
   name + body. Inspired by The Solved Skin ref. */
function LayoutTabbed({ variation, pos, sizes = {}, F, frame, editOn, onPosChange, onResize, accent, fontStack, fontH2 }) {  const isStory = frame === 'story';

  // Soft tint under everything to add warmth (over the image).
  const gradientOverlay = (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.35) 100%)`,
    }} />
  );

  return (
    <>
      {gradientOverlay}

      {/* Product/lifestyle "tab" — a draggable decorative pill-tab overlay.
          We don't embed a separate image; instead it's a subtle accent frame
          that draws a soft beveled edge onto the hero image. */}
      <DraggableBlock
        frac={pos.product} frameW={F.w} frameH={F.h} editOn={editOn}
        handleLabel="●" widthFrac={isStory ? 0.36 : 0.32}
        size={sizes.product}
        onResize={onResize ? (s)=>onResize('product', s) : undefined}
        onChange={(p)=>onPosChange('product', p)}>
        <ProductCutout variation={variation} editOn={editOn} />
      </DraggableBlock>

      {/* Main speech-bubble card */}
      <DraggableBlock
        frac={pos.card} frameW={F.w} frameH={F.h} editOn={editOn}
        handleLabel="❝" widthFrac={0.7}
        size={sizes.card}
        onResize={onResize ? (s)=>onResize('card', s) : undefined}
        onChange={(p)=>onPosChange('card', p)}>
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '40px 44px 36px',
          boxShadow: '0 14px 40px rgba(0,0,0,.22)',
          position: 'relative',
          backgroundImage: `repeating-linear-gradient(180deg, rgba(0,0,0,.035) 0 1px, transparent 1px 36px)`,
          color: accent,
        }}>
          {/* tab notch */}
          <div style={{
            position: 'absolute', top: -16, left: 32,
            background: '#ffffff',
            padding: '6px 22px',
            borderRadius: '12px 12px 0 0',
            fontFamily: fontStack,
            fontSize: 18, color: accent, letterSpacing: 2,
            textTransform: 'uppercase', fontWeight: 500,
          }}>Review</div>

          <div style={{ marginBottom: 18 }}>
            <Stars rating={variation.rating} size={34} color={accent} trail="rgba(0,0,0,.1)" />
          </div>

          {variation.author && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 20,
            }}>
              <PersonAvatar size={40} bg={accent} color="#fff" />
              <div style={{
                fontFamily: fontH2 || '"Geist", sans-serif',
                fontSize: 24, fontWeight: 700, letterSpacing: 1.5,
                textTransform: 'uppercase', color: accent,
              }}>{variation.author}</div>
            </div>
          )}

          {variation.body && (
            <div style={{
              fontFamily: fontStack,
              fontSize: 32, fontWeight: 400, lineHeight: 1.3,
              letterSpacing: -0.3, color: 'rgba(0,0,0,.75)',
              textWrap: 'pretty',
            }}>{variation.body}</div>
          )}
        </div>
      </DraggableBlock>
    </>
  );
}

/* ───── Product cutout slot (Tabbed layout) ────────────────────────────────
   Uploads to ImageStore under `${variation.id}__product`. Click or drop to
   upload; displays uploaded image with transparent-friendly `contain` fit. */
function ProductCutout({ variation, editOn }) {
  useImageStore();
  const key = variation.id + '__product';
  const img = ImageStore.get(key);
  const fileRef = React.useRef(null);

  const onFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = (e) => ImageStore.set(key, e.target.result);
    r.readAsDataURL(file);
  };

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div style={{
      position:'relative',
      aspectRatio: '1 / 1.15',
      background: 'rgba(255,255,255,.92)',
      borderRadius: 22,
      boxShadow: '0 18px 40px rgba(0,0,0,.22)',
      overflow:'hidden',
    }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={(e)=>onFile(e.target.files[0])} />

      {img ? (
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${img})`,
          backgroundSize:'contain',
          backgroundPosition:'center',
          backgroundRepeat:'no-repeat',
        }} />
      ) : (
        <div
          onPointerDown={stop}
          onClick={(e)=>{ stop(e); fileRef.current && fileRef.current.click(); }}
          onDragOver={(e)=>{ stop(e); e.currentTarget.style.background='rgba(181,138,84,.15)'; }}
          onDragLeave={(e)=>{ e.currentTarget.style.background='transparent'; }}
          onDrop={(e)=>{ stop(e); e.currentTarget.style.background='transparent'; onFile(e.dataTransfer.files[0]); }}
          style={{
            position:'absolute', inset:0,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
            color:'rgba(0,0,0,.35)',
            fontFamily:'"Geist", sans-serif', fontSize:18, fontWeight:500,
            letterSpacing:1.2, textTransform:'uppercase',
            textAlign:'center', padding:18, boxSizing:'border-box',
            border:'2px dashed rgba(0,0,0,.15)', borderRadius:22,
            transition:'background .15s, border-color .15s, color .15s',
          }}
          onMouseEnter={(e)=>{ e.currentTarget.style.borderColor='#b58a54'; e.currentTarget.style.color='#b58a54'; }}
          onMouseLeave={(e)=>{ e.currentTarget.style.borderColor='rgba(0,0,0,.15)'; e.currentTarget.style.color='rgba(0,0,0,.35)'; }}>
          <div style={{ fontSize:28, marginBottom:6 }}>↑</div>
          <div>Product cutout</div>
          <div style={{ fontSize:11, fontWeight:400, marginTop:4, opacity:.7, textTransform:'none', letterSpacing:0 }}>
            Click or drop (PNG with alpha works best)
          </div>
        </div>
      )}

      {img && editOn && (
        <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:6, zIndex:2 }}
             onPointerDown={stop}>
          <button onClick={(e)=>{ stop(e); fileRef.current && fileRef.current.click(); }}
            style={{ border:'none', background:'rgba(0,0,0,.55)', color:'#fff', borderRadius:10, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>
            Replace
          </button>
          <button onClick={(e)=>{ stop(e); ImageStore.clear(key); }}
            style={{ border:'none', background:'rgba(0,0,0,.55)', color:'#fff', borderRadius:10, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LayoutCard, LayoutEditorial, LayoutTabbed, Stars, PersonAvatar, ProductCutout });

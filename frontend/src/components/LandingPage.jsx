import ThemeToggle from './ThemeToggle'

// Floating medical crosses decoration
const CROSSES = [
  { top: '12%',  right: '4%',   delay: '0s',   size: 20 },
  { top: '28%',  right: '1%',   delay: '1.2s', size: 16 },
  { top: '50%',  right: '6%',   delay: '2.4s', size: 14 },
  { top: '70%',  right: '2%',   delay: '0.6s', size: 18 },
  { top: '85%',  right: '5%',   delay: '1.8s', size: 12 },
  { top: '10%',  left:  '2%',   delay: '0.9s', size: 15 },
  { top: '40%',  left:  '0.5%', delay: '2s',   size: 13 },
  { top: '65%',  left:  '3%',   delay: '3s',   size: 17 },
]

const FEATURES = [
  {
    icon: '🫁',
    title: 'Multi-Disease Detection',
    desc:  'Detects 14+ cardiopulmonary conditions with calibrated confidence scores.',
  },
  {
    icon: '🗺️',
    title: 'Visual Explanations',
    desc:  'Grad-CAM++ heatmaps and ViT attention maps reveal model reasoning.',
  },
  {
    icon: '📈',
    title: 'Clinical Accuracy',
    desc:  'Temperature-calibrated probabilities with MC-Dropout uncertainty bounds.',
  },
]

export default function LandingPage({ onEnterApp }) {
  return (
    <>
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-inner">
          {/* Logo */}
          <a href="#" className="nav-logo" aria-label="Doctor-X Home">
            <div className="nav-logo-icon">✚</div>
            <span className="nav-logo-text">Doctor-X</span>
          </a>

          {/* Nav links */}
          <div className="nav-links">
            <a href="#" className="nav-link">Platform</a>
            <a href="#" className="nav-link">Technology</a>
            <a href="#" className="nav-link">Cases</a>
            <a href="#" className="nav-link">API</a>
            <a href="#" className="nav-link">Resources</a>
          </div>

          {/* Right controls */}
          <div className="nav-right">
            <ThemeToggle />
            <button
              id="nav-request-demo-btn"
              className="btn-demo"
              onClick={onEnterApp}
            >
              Request Demo
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="hero">
        {/* Grid + floating crosses */}
        <div className="hero-crosses" aria-hidden="true">
          {CROSSES.map((c, i) => (
            <span
              key={i}
              className="hero-cross"
              style={{
                top: c.top,
                right: c.right,
                left: c.left,
                fontSize: c.size,
                animationDelay: c.delay,
                animationDuration: `${6 + i * 0.7}s`,
              }}
            >
              ✚
            </span>
          ))}
        </div>

        <div className="hero-content">
          {/* Left text block */}
          <div className="hero-left slide-up">
            <div className="hero-eyebrow">
              <span>✨</span> AI-Powered Radiology
            </div>

            <h1 className="hero-h1">
              Explainable AI for{' '}
              <span>Comprehensive Chest X-ray</span>{' '}
              Diagnosis
            </h1>

            <p className="hero-p">
              Accurate, transparent multi-disease insights from chest radiographs,
              empowering clinicians with trust and clarity.
            </p>

            <div className="hero-btns">
              <button
                id="hero-explore-btn"
                className="btn-primary-hero"
                onClick={onEnterApp}
              >
                🚀 Explore Platform
              </button>
              <a href="#features" className="btn-secondary-hero">
                Learn More
              </a>
            </div>
          </div>

          {/* Right mockup */}
          <div className="hero-right fade-in">
            <div className="mockup-glow" />
            <div className="mockup-window">
              <img
                src="/hero_mockup.jpg"
                alt="Doctor-X AI analysis interface showing chest X-ray with heatmap overlays and AI Explainer Panel"
                loading="eager"
                onError={e => {
                  // Graceful CSS fallback when image not yet in public/
                  e.target.style.display = 'none'
                  e.target.parentElement.style.background = 'linear-gradient(135deg, #0a0c14 0%, #131726 100%)'
                  e.target.parentElement.style.minHeight = '340px'
                  e.target.parentElement.style.display = 'flex'
                  e.target.parentElement.style.alignItems = 'center'
                  e.target.parentElement.style.justifyContent = 'center'
                  const fallback = document.createElement('div')
                  fallback.innerHTML = '<div style="text-align:center;color:#4a5568;padding:40px"><div style="font-size:56px;margin-bottom:12px">🫁</div><div style="font-size:13px">Run <code style=\'color:#20c4e4\'>node scripts/copyHeroImage.js</code><br/>to load the hero image</div></div>'
                  e.target.parentElement.appendChild(fallback)
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section className="features" id="features">
        <div className="features-inner">
          <div className="features-eyebrow">Capabilities</div>
          <h2 className="features-h2">Transforming Radiodiagnosis with Clarity</h2>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feat-card fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-text">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: 'center',
              marginTop: 36,
              fontSize: 13,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            Developed with Clinicians, for Clinicians.
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <span style={{ fontSize: 14 }}>✚</span> Doctor-X
          </div>
          <div className="footer-links">
            <a href="#">Links</a>
            <a href="#">Technology</a>
            <a href="#">Cases</a>
            <a href="#">Press</a>
          </div>
          <div className="footer-copy">© Doctor-X 2026</div>
        </div>
      </footer>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeftRight,
  ChevronDown,
  ShieldCheck,
  LockKeyhole,
  Globe2,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Clock3,
  Check,
  Leaf,
  Wallet,
  Landmark,
  CreditCard,
  TrendingUp,
  Banknote,
  House,
  Send,
  Plus,
  Minus,
  Monitor,
  Star,
  BadgeCheck,
} from 'lucide-react'
import {
  handleAuthCallback,
  getUser,
  login,
  signup,
  getSettings,
  requestPasswordRecovery,
  updateUser,
  acceptInvite,
  oauthLogin,
} from '@netlify/identity'
import type { User, Settings } from '@netlify/identity'
import { Workspace } from './workspace'
export async function api(path: string, data?: unknown) {
  if (data && ['transfer', 'application'].includes(path))
    throw new Error(
      'This feature is currently unavailable. Evergreen is a demonstration and does not process real financial activity.',
    )
  const r = await fetch('/api/banking/' + path, {
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  })
  const b = await r.json()
  if (!r.ok) throw new Error(b.error || 'Please try again.')
  return b
}
export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    n / 100,
  )
export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Evergreen home">
      <span className="brandmark">
        <Leaf size={25} />
      </span>
      evergreen<span className="brand-dot">.</span>
    </a>
  )
}
export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string
  children: ReactNode
  secondary?: boolean
}) {
  return (
    <a className={'button ' + (secondary ? 'secondary' : '')} href={href}>
      {children}
      <ArrowUpRight size={16} />
    </a>
  )
}
export function EvergreenApp() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [invite, setInvite] = useState<string>()
  const [recovery, setRecovery] = useState(false)
  const [authError, setAuthError] = useState('')
  useEffect(() => {
    ;(async () => {
      try {
        const callback = await handleAuthCallback()
        if (callback?.type === 'invite' && callback.token)
          setInvite(callback.token)
        if (callback?.type === 'recovery') setRecovery(true)
        setUser(await getUser())
      } catch {
        setAuthError(
          'Your sign-in link could not be completed. Please request a new link or sign in again.',
        )
      } finally {
        setReady(true)
      }
    })()
  }, [])
  if (path.startsWith('/account') || path.startsWith('/admin'))
    return <Workspace path={path} user={user} ready={ready} />
  const auth =
    ['/login', '/register', '/forgot-password'].includes(path) ||
    invite ||
    recovery
  return (
    <>
      <Header />
      <main>
        {authError && (
          <p className="form-notice container" role="alert">
            {authError} <a href="/login">Sign in</a>
          </p>
        )}
        {auth ? (
          <Auth path={path} invite={invite} recovery={recovery} />
        ) : path === '/contact' ? (
          <Contact />
        ) : path === '/aboutus' ? (
          <About />
        ) : path === '/' ? (
          <Home />
        ) : (
          <section className="container section">
            <h1>Page not found</h1>
            <p>Let’s get you back to familiar ground.</p>
            <ButtonLink href="/">Back to home</ButtonLink>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
function Header() {
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState('')
  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setDrop('')
      }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [])
  return (
    <>
      <div className="support">
        <div className="container">
          <a href="mailto:hello@evergreen.example">
            <Mail size={12} /> hello@evergreen.example
          </a>
          <span>
            Banking demonstration · No real funds <ArrowUpRight size={12} />
          </span>
        </div>
      </div>
      <header className="header container">
        <Brand />
        <div className="banking-label">
          Personal Banking
          <br />
          <span>Business Banking</span>
        </div>
        <button
          className="mobile-toggle"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'open' : ''} aria-label="Main navigation">
          <div className="dropdown">
            <button
              onClick={() => setDrop(drop === 'home' ? '' : 'home')}
              aria-expanded={drop === 'home'}
            >
              Home <ChevronDown size={12} />
            </button>
            {drop === 'home' && (
              <div className="dropdown-panel">
                <a href="/">
                  Home 1 <ArrowUpRight size={14} />
                </a>
              </div>
            )}
          </div>
          <a href="/aboutus">About Us</a>
          <a href="/register">Open Account</a>
          <div className="dropdown">
            <button
              onClick={() => setDrop(drop === 'security' ? '' : 'security')}
              aria-expanded={drop === 'security'}
            >
              Security Tips <ChevronDown size={12} />
            </button>
            {drop === 'security' && (
              <div className="dropdown-panel security-tips">
                <strong>Stay a step ahead</strong>
                <p>
                  Use a unique password. Never share verification codes. Only
                  upload fictional documents to this demo.
                </p>
              </div>
            )}
          </div>
          <a href="/contact">Contact Us</a>
          <a className="nav-login" href="/login">
            Online Banking <ArrowUpRight size={14} />
          </a>
          <a className="button small" href="/register">
            Enrolment <ArrowUpRight size={14} />
          </a>
        </nav>
      </header>
    </>
  )
}
function Exchange() {
  const [amount, setAmount] = useState('25040')
  const [reverse, setReverse] = useState(false)
  const rate = reverse ? 1 / 0.5639874 : 0.5639874
  const target = Math.min(1000000000, Math.max(0, Number(amount) || 0)) * rate
  const [displayed, setDisplayed] = useState(target)
  const previous = useRef(target)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(target)
      previous.current = target
      return
    }
    const start = performance.now()
    const from = previous.current
    let frame = 0
    function animate(now: number) {
      const progress = Math.min(1, (now - start) / 280)
      const value = from + (target - from) * (1 - Math.pow(1 - progress, 3))
      setDisplayed(value)
      previous.current = value
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target])
  const receive = displayed.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  function swap() {
    setAmount((Math.max(0, Number(amount) || 0) * rate).toFixed(2))
    setReverse(!reverse)
  }
  return (
    <div className="exchange" id="exchange">
      <div className="exchange-top">
        <span>
          <Globe2 size={18} /> Exchange Rates
        </span>
        <span className="live-dot">Illustrative rate</span>
      </div>
      <label htmlFor="sendAmount">You send</label>
      <div className="currency-input">
        <input
          id="sendAmount"
          type="number"
          min="0"
          max="1000000000"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span>
          <b className="flag">{reverse ? 'EU' : 'UK'}</b>
          {reverse ? 'EUR' : 'GBP'}
          <ChevronDown size={13} />
        </span>
      </div>
      <div className="rate-line">
        <span className="rate-dots" />
        <span>
          Exchange rate{' '}
          <b>
            1 {reverse ? 'EUR' : 'GBP'} = {rate.toFixed(7)}{' '}
            {reverse ? 'GBP' : 'EUR'}
          </b>
        </span>
        <button aria-label="Swap currencies" onClick={swap}>
          <ArrowLeftRight size={17} />
        </button>
      </div>
      <div className="rate-line guarantee">
        <ShieldCheck size={15} />
        <span>Sample rate · no live rate guarantee</span>
      </div>
      <label>Recipient gets</label>
      <div className="currency-input receive">
        <output aria-live="polite">{receive}</output>
        <span>
          <b className="flag">{reverse ? 'UK' : 'EU'}</b>
          {reverse ? 'GBP' : 'EUR'}
          <ChevronDown size={13} />
        </span>
      </div>
      <p className="approx">Approximate amount. This is a demo calculator.</p>
      <a className="button exchange-button" href="/register">
        Let’s make your first move <ArrowUpRight size={17} />
      </a>
      <div className="exchange-bottom">
        <LockKeyhole size={12} /> Your next chapter starts here{' '}
        <a href="/login">
          Sign in <ArrowRight size={12} />
        </a>
      </div>
    </div>
  )
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-shading" />
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow light">
              <span className="badge-icon">
                <ShieldCheck size={14} />
              </span>{' '}
              SECURE GLOBAL BANKING
            </span>
            <h1>
              Send money to
              <br />
              <span>130+ countries.</span>
            </h1>
            <p>
              Fast, secure, and transparent transfers with illustrative rates.
              <br className="desktop" /> Your money moves at the speed of
              possibility.
            </p>
            <div className="benefits">
              <span>In minutes</span>
              <span>Low fees</span>
              <span>Great rates</span>
            </div>
            <ButtonLink href="/login">Get Started Now</ButtonLink>
            <div className="hero-note">
              <ShieldCheck size={14} />
              <span>Made for a life without borders.</span>
            </div>
          </div>
          <Exchange />
          <div className="hero-bottom">
            <span className="scroll-cue">
              <span /> SCROLL TO EXPLORE
            </span>
            <span>
              Wherever life takes you, grow with it. <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </section>
      <div className="trust-bar">
        <div className="container">
          <span>
            <Globe2 />A world of possibilities
          </span>
          <i />
          <span>
            <ArrowLeftRight />
            Transparent by design
          </span>
          <i />
          <span>
            <ShieldCheck />
            Built around you
          </span>
          <i />
          <span>
            <Leaf />
            Room to grow
          </span>
        </div>
      </div>
      <Setup />
      <Transfers />
      <Why />
      <Services />
      <Features />
      <Closing />
    </>
  )
}
const steps = [
  [
    'Register in minutes',
    'A few details, a fresh start. Create your account and explore what’s possible.',
  ],
  [
    'Verify your details',
    'Use fictional sample documents to explore the demo verification process.',
  ],
  [
    'Set up your transfer',
    'Choose a destination and see an illustrative exchange rate before you begin.',
  ],
  [
    'Make your payment',
    'Confirm your simulated transfer. No real funds move in this demonstration.',
  ],
  [
    'Track & done',
    'Follow each simulated transaction in your account activity.',
  ],
]
function Setup() {
  const [active, setActive] = useState(0)
  return (
    <section className="container section split setup">
      <div>
        <span className="eyebrow">A SIMPLE START</span>
        <h2>
          Big possibilities.
          <br />
          Five simple steps.
        </h2>
        <p className="section-intro">
          Less time getting started. More time getting on with life.
        </p>
        <div className="steps">
          {steps.map(([title, text], i) => (
            <div
              key={title}
              className={'step ' + (active === i ? 'active' : '')}
            >
              <button
                aria-expanded={active === i}
                onClick={() => setActive(active === i ? -1 : i)}
              >
                <span className="step-number">0{i + 1}</span>
                <strong>{title}</strong>
                {active === i ? <Minus size={16} /> : <Plus size={16} />}
              </button>
              {active === i && <p>{text}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="setup-art">
        <img
          src="/.netlify/images?url=/img/evergreen-home.png&w=850&fm=webp"
          alt="A couple planning their next chapter together"
        />
        <div className="floating-note">
          <span>
            <BadgeCheck size={25} />
          </span>
          <div>
            <strong>Life moves. So do we.</strong>
            <small>Your everyday, made simpler.</small>
          </div>
        </div>
        <div className="mini-account">
          <Brand />
          <small>YOUR POSSIBILITIES</small>
          <strong>
            One account.
            <br />A world of opportunity.
          </strong>
          <div className="mini-line" />
          <span>
            EVERGREEN PERSONAL <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </section>
  )
}
const offerings = [
  {
    icon: ArrowLeftRight,
    title: 'More money. Fewer borders.',
    text: 'Explore straightforward transfers with clear, illustrative rates.',
  },
  {
    icon: Landmark,
    title: 'Space for your business.',
    text: 'Discover sample business lending and the next step for your ideas.',
  },
  {
    icon: Wallet,
    title: 'Your money, in perspective.',
    text: 'Keep everyday activity and account details in one simple place.',
  },
  {
    icon: Globe2,
    title: 'Think beyond one currency.',
    text: 'Explore international payments for a more connected life.',
  },
]
function Transfers() {
  return (
    <section className="soft-section">
      <div className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GLOBAL REACH. PERSONAL TOUCH.</span>
            <h2>
              A little less in fees.
              <br />A little more for you.
            </h2>
          </div>
          <p>
            No subscription fee in this demonstration.
            <br />
            Just a simpler way to explore moving money.
          </p>
        </div>
        <div className="offering-grid">
          {offerings.map(({ icon: Icon, title, text }, i) => (
            <a href="/login" className="offering" key={title}>
              <span className="offering-number">0{i + 1}</span>
              <Icon size={29} />
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="text-link">
                Explore the possibilities <ArrowUpRight size={17} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
function Why() {
  return (
    <section className="container section split why">
      <div className="collage">
        <img
          src="/.netlify/images?url=/img/evergreen-home.png&w=900&fm=webp"
          alt="Sharing a happy moment at home"
        />
        <div className="collage-card">
          <Globe2 size={35} />
          <strong>
            Local feeling.
            <br />
            Global possibilities.
          </strong>
          <span>130+ countries to explore</span>
        </div>
        <span className="photo-caption">FOR THE LIFE YOU’RE BUILDING.</span>
      </div>
      <div>
        <span className="eyebrow">A WORLD THAT FEELS CLOSER</span>
        <h2>
          New country.
          <br />
          Same sense of home.
        </h2>
        <p className="section-intro">
          Moving abroad, sending a little love home, or building something new.
          Your money should feel at home wherever you are.
        </p>
        <ul className="check-list">
          <li>
            <Check />
            Explore lower-cost ways to send money
          </li>
          <li>
            <Check />
            Make sense of spending across borders
          </li>
          <li>
            <Check />
            Keep your global financial life together
          </li>
        </ul>
        <ButtonLink href="/aboutus" secondary>
          Get to know Evergreen
        </ButtonLink>
      </div>
    </section>
  )
}
const services = [
  {
    icon: Wallet,
    title: 'Personal Checking',
    text: 'For the little things. And the everyday big things.',
  },
  {
    icon: Leaf,
    title: 'Personal Savings',
    text: 'Make room for whatever comes next.',
  },
  {
    icon: TrendingUp,
    title: 'Investment Account',
    text: 'Explore a longer view of your financial life.',
  },
  {
    icon: Banknote,
    title: 'Personal Loans',
    text: 'A sample stepping stone to your next chapter.',
  },
  {
    icon: House,
    title: 'Mortgage Loans',
    text: 'Imagine a place to put down roots.',
  },
  {
    icon: CreditCard,
    title: 'Credit Cards',
    text: 'Explore everyday flexibility, on your terms.',
  },
]
function Services() {
  return (
    <section className="services">
      <div className="container section">
        <span className="eyebrow light">THE EVERGREEN WAY</span>
        <div className="section-heading">
          <h2>
            More than an account.
            <br />A world of possibilities.
          </h2>
          <p>
            Everyday essentials. Bigger ambitions.
            <br />
            Find a little space for both.
          </p>
        </div>
        <div className="service-grid">
          {services.map(({ icon: Icon, title, text }) => (
            <a key={title} href="/register">
              <Icon size={29} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowUpRight size={20} />
            </a>
          ))}
        </div>
        <p className="service-disclaimer">
          Product previews only. Evergreen is a banking demonstration and does
          not offer regulated financial services.
        </p>
      </div>
    </section>
  )
}
function Features() {
  return (
    <section className="container section split">
      <div className="feature-visual">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="feature-logo">
          <Leaf size={68} />
        </div>
        <span className="floating-label label-one">
          <ShieldCheck size={18} /> Thoughtfully connected
        </span>
        <span className="floating-label label-two">
          <Globe2 size={18} /> Open to possibility
        </span>
        <span className="floating-label label-three">
          <ArrowLeftRight size={18} /> Made for everyday
        </span>
      </div>
      <div>
        <span className="eyebrow">LESS FRICTION. MORE LIVING.</span>
        <h2>
          Your next move,
          <br />
          made simpler.
        </h2>
        <p className="section-intro">
          A clear view of your money and thoughtful tools that help you explore
          what comes next.
        </p>
        <div className="feature-list">
          {[
            [
              Clock3,
              'Time on your side',
              'Simple flows, without the runaround.',
            ],
            [
              Monitor,
              'Clarity comes first',
              'Know what’s happening at every step.',
            ],
            [
              ShieldCheck,
              'Thoughtful by design',
              'Protected accounts and clear permissions.',
            ],
            [
              Wallet,
              'Everyday convenience',
              'Your financial world, all in one place.',
            ],
          ].map(([I, title, text]) => {
            const Icon = I as typeof Clock3
            return (
              <div key={String(title)}>
                <Icon size={20} />
                <span>
                  <strong>{String(title)}</strong>
                  <small>{String(text)}</small>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
function Closing() {
  return (
    <section className="container closing">
      <div>
        <span className="eyebrow light">HERE’S TO YOUR NEXT CHAPTER</span>
        <h2>
          A bigger world.
          <br />A brighter financial future.
        </h2>
        <p>
          For international business, family back home, and everything in
          between.
        </p>
        <div className="cta-actions">
          <ButtonLink href="/register">Personal Account</ButtonLink>
          <ButtonLink href="/register" secondary>
            Business Account
          </ButtonLink>
        </div>
      </div>
      <div className="plane-art" aria-hidden="true">
        <Globe2 />
        <Send />
      </div>
    </section>
  )
}
function PageTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="page-title">
      <div className="container">
        <span className="eyebrow">
          <a href="/">HOME</a> / {title.toUpperCase()}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}
function About() {
  return (
    <>
      <PageTitle
        title="A little more possibility."
        description="We believe your financial world should be as open as your ambitions."
      />
      <Why />
      <Transfers />
      <section className="container section">
        <span className="eyebrow">FOR YOUR NEXT BIG IDEA</span>
        <h2>
          Grow your business.
          <br />
          Keep more possibilities open.
        </h2>
        <div className="business-grid">
          {[
            'Reliable Online Payment',
            'Low Transaction Fee',
            'Thoughtful Security',
            'Better Connections',
            'Clear Payment Status',
            'Real Time Money Tracking',
          ].map((t) => (
            <article key={t}>
              <Check />
              <h3>{t}</h3>
              <p>
                Explore tools designed to make a connected business life easier.
                Demonstration features only.
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="soft-section">
        <div className="container section">
          <span className="eyebrow">IMAGINE THE POSSIBILITIES</span>
          <h2>
            Different lives.
            <br />A shared sense of possibility.
          </h2>
          <p>Fictional stories illustrating the Evergreen experience.</p>
          <div className="testimonials">
            {[
              [
                'Maya Okafor',
                'Freelance designer',
                '“Having a clear view of everything gives me more time to focus on the work I love.”',
              ],
              [
                'Elliot Chen',
                'Small business owner',
                '“A simple way to imagine what my business could do next.”',
              ],
            ].map(([n, r, q]) => (
              <blockquote key={n}>
                <div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} />
                  ))}
                </div>
                <p>{q}</p>
                <strong>{n}</strong>
                <small>{r} · Sample testimonial</small>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
      <Closing />
    </>
  )
}
function Contact() {
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setPending(true)
    try {
      const b = await api('inquiry', { ...values, kind: 'contact' })
      setNotice(b.message)
      form.reset()
    } catch (e) {
      setNotice((e as Error).message)
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <PageTitle
        title="Let’s talk."
        description="A question, an idea, or a little guidance. Start a conversation with Evergreen."
      />
      <section className="container section">
        <div className="contact-cards">
          {[
            [Mail, 'Email', 'hello@evergreen.example'],
            [Phone, 'Phone', '+1 (202) 555-0148'],
            [MapPin, 'Visit us', '128 Greenway Lane, Austin, TX · fictional'],
            [Clock3, 'Hours', 'Mon–Fri 7am–7pm CT · Sat 7am–4pm CT'],
          ].map(([I, t, v]) => {
            const Icon = I as typeof Mail
            return (
              <article key={String(t)}>
                <Icon />
                <h3>{String(t)}</h3>
                <p>{String(v)}</p>
              </article>
            )
          })}
        </div>
        <div className="split contact-layout">
          <div>
            <span className="eyebrow">GET IN TOUCH</span>
            <h2>
              Good conversations
              <br />
              start here.
            </h2>
            <p className="section-intro">
              This demo saves your inquiry to a protected inbox. Email delivery
              and staffed support are not connected. Please use fictional
              information.
            </p>
            <div className="info-panel">
              <ShieldCheck />
              <h3>Why contact us?</h3>
              <p>
                Questions about your account, feedback on the experience, or a
                new partnership idea.
              </p>
            </div>
            <div className="info-panel">
              <Clock3 />
              <h3>A little clarity on response times</h3>
              <p>
                No human response is promised in this demonstration. Browse
                Security Tips for helpful guidance.
              </p>
            </div>
          </div>
          <form className="panel form-grid" onSubmit={submit}>
            <Field label="Full name" name="name" />
            <Field label="Email address" name="email" type="email" />
            <Field label="Phone (optional)" name="phone" required={false} />
            <SelectField
              label="Subject"
              name="subject"
              options={[
                'General Inquiry',
                'Technical Support',
                'Billing Question',
                'Feedback',
                'Partnership',
              ]}
            />
            <label className="full">
              Your message
              <textarea name="message" required maxLength={5000} rows={5} />
            </label>
            <input
              className="honeypot"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <button className="button full" disabled={pending}>
              {pending ? 'Saving your message…' : 'Send Message'}
              <ArrowUpRight size={16} />
            </button>
            {notice && (
              <p className="form-notice full" role="status">
                {notice}
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  )
}
export function Field({
  label,
  name,
  type = 'text',
  required = true,
  defaultValue,
  min,
  max,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string | number
  min?: number
  max?: number
  placeholder?: string
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={type === 'number' ? '0.01' : undefined}
        maxLength={type === 'password' ? 128 : 300}
        minLength={type === 'password' ? 12 : undefined}
        placeholder={placeholder}
      />
    </label>
  )
}
export function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: string[]
  defaultValue?: string
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}
export function Countries() {
  const names = new Intl.DisplayNames(['en'], { type: 'region' })
  const countries = []
  for (let a = 65; a <= 90; a++)
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b)
      const name = names.of(code)
      if (
        name &&
        name !== code &&
        !['EU', 'UN', 'EZ', 'QO', 'XA', 'XB', 'ZZ', 'UK'].includes(code)
      )
        countries.push(name)
    }
  return (
    <SelectField
      label="Country"
      name="country"
      options={[...new Set(countries)].sort()}
      defaultValue="United States"
    />
  )
}
function Auth({
  path,
  invite,
  recovery,
}: {
  path: string
  invite?: string
  recovery: boolean
}) {
  const register = path === '/register'
  const forgot = path === '/forgot-password'
  const reset = !!invite || recovery
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const [show, setShow] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() =>
        setNotice(
          'Authentication settings are currently unavailable. Please try again after deployment.',
        ),
      )
  }, [])
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >
    setPending(true)
    setNotice('')
    try {
      if (register || reset) {
        if (d.password !== d.confirm) throw new Error('Passwords do not match.')
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}/.test(d.password))
          throw new Error(
            'Use at least 12 characters with upper and lower case letters and a number.',
          )
      }
      if (reset) {
        if (invite) await acceptInvite(invite, d.password)
        else await updateUser({ password: d.password })
        setNotice('Your password was saved. You can now sign in.')
      } else if (forgot) {
        await requestPasswordRecovery(d.email)
        setNotice(
          'If an account exists for this address, recovery instructions are on their way.',
        )
      } else if (register) {
        await signup(d.email, d.password, {
          full_name: d.firstName + ' ' + d.lastName,
          first_name: d.firstName,
          last_name: d.lastName,
          phone: d.phone,
          country: d.country,
          account_type: d.accountType,
        })
        setNotice(
          'Account created. Check your email to confirm your account, then sign in.',
        )
      } else {
        const u = await login(d.email, d.password)
        window.location.href = u.roles?.includes('admin')
          ? '/admin'
          : '/account'
      }
    } catch (e) {
      setNotice((e as Error).message || 'Unable to continue. Please try again.')
    } finally {
      setPending(false)
    }
  }
  return (
    <section className="auth-section">
      <div className={'auth-card ' + (register ? 'wide' : '')}>
        <span className="auth-icon">
          <LockKeyhole size={23} />
        </span>
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h1>
          {reset
            ? 'Choose a new password'
            : register
              ? 'Create your account'
              : forgot
                ? 'A fresh start.'
                : 'Welcome back.'}
        </h1>
        <p>
          {register
            ? 'A little information. A world of possibilities.'
            : forgot
              ? 'Enter your email to request a password recovery link.'
              : 'Your financial world, right where you left it.'}
        </p>
        <form onSubmit={submit} className={register ? 'form-grid' : ''}>
          {register && (
            <>
              <h3 className="full">Personal details</h3>
              <Field label="First name" name="firstName" />
              <Field label="Last name" name="lastName" />
              <Field label="Phone (optional)" name="phone" required={false} />
              <Countries />
              <h3 className="full">Banking details</h3>
              <SelectField
                label="Account type"
                name="accountType"
                options={[
                  'Personal Account',
                  'Business Account',
                  'Savings Account',
                ]}
              />
            </>
          )}
          {!reset && <Field label="Email address" type="email" name="email" />}
          {!forgot && (
            <>
              <div className="password-field">
                <Field
                  label={reset ? 'New password' : 'Password'}
                  type={show ? 'text' : 'password'}
                  name="password"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
              {(register || reset) && (
                <>
                  <Field
                    label="Confirm password"
                    type="password"
                    name="confirm"
                  />
                  <small className="full">
                    12+ characters, including uppercase, lowercase, and a
                    number. Add a sample profile photo after sign in.
                  </small>
                </>
              )}
            </>
          )}
          {!register && !forgot && !reset && (
            <div className="form-between">
              <label className="check-label">
                <input type="checkbox" name="remember" /> Remember me
              </label>
              <a href="/forgot-password">Forgot password?</a>
            </div>
          )}
          {register && (
            <label className="check-label full">
              <input type="checkbox" required /> I understand this is a
              demonstration. No real money or financial services.
            </label>
          )}
          <button
            className="button full"
            disabled={
              pending || !settings || (register && settings.disableSignup)
            }
          >
            {pending
              ? 'One moment…'
              : reset
                ? 'Save password'
                : register
                  ? 'Create Account'
                  : forgot
                    ? 'Send recovery link'
                    : 'Sign In'}
            <ArrowUpRight size={16} />
          </button>
        </form>
        {settings?.disableSignup && register && (
          <p className="form-notice">
            Registration is currently invite only. Please use your invitation
            link.
          </p>
        )}
        {notice && (
          <p role="status" className="form-notice">
            {notice}
          </p>
        )}
        {!register &&
          !forgot &&
          !reset &&
          settings &&
          Object.entries(settings.providers || {})
            .filter(
              ([provider, enabled]) =>
                enabled &&
                ['google', 'github', 'gitlab', 'bitbucket'].includes(provider),
            )
            .map(([provider]) => (
              <button
                key={provider}
                className="button secondary oauth"
                onClick={() => oauthLogin(provider as 'google')}
              >
                Continue with {provider}
              </button>
            ))}
        <div className="auth-bottom">
          {register ? (
            <>
              Already growing with us? <a href="/login">Sign in</a>
            </>
          ) : (
            <>
              New to Evergreen?{' '}
              <a href="/register">
                Create an account <ArrowRight size={13} />
              </a>
            </>
          )}
        </div>
        <div className="auth-security">
          <ShieldCheck size={15} /> Protected sign in. Clearly simulated
          banking.
        </div>
      </div>
    </section>
  )
}
function Footer() {
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  async function subscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = e.currentTarget
    setPending(true)
    try {
      const r = await api('inquiry', {
        kind: 'newsletter',
        email: new FormData(f).get('email'),
      })
      setNotice(r.message)
      f.reset()
    } catch (e) {
      setNotice((e as Error).message)
    } finally {
      setPending(false)
    }
  }
  return (
    <footer>
      <div className="container footer-top">
        <div className="footer-brand">
          <Brand />
          <p>
            A little more connected.
            <br />A world more possible.
          </p>
          <div className="socials">
            <a href="/contact" aria-label="Contact Evergreen">
              <Mail size={16} />
            </a>
            <a href="/aboutus" aria-label="About Evergreen">
              <Leaf size={16} />
            </a>
            <a href="/contact" aria-label="Evergreen business enquiries">
              <Globe2 size={16} />
            </a>
          </div>
        </div>
        <div>
          <h3>Explore</h3>
          <a href="/aboutus">About Evergreen</a>
          <a href="/register">Open an account</a>
          <a href="/login">Online banking</a>
          <a href="/contact">Contact us</a>
        </div>
        <div>
          <h3>Here to help</h3>
          <a href="/contact">Support & enquiries</a>
          <a href="/forgot-password">Account recovery</a>
          <a href="/aboutus">Our approach</a>
          <a href="mailto:hello@evergreen.example">hello@evergreen.example</a>
        </div>
        <div className="newsletter">
          <h3>A little inspiration in your inbox.</h3>
          <p>Register your interest in Evergreen news.</p>
          <form onSubmit={subscribe}>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              placeholder="Your email address"
              required
            />
            <button aria-label="Subscribe" disabled={pending}>
              {pending ? '…' : <ArrowRight size={19} />}
            </button>
          </form>
          {notice && <small role="status">{notice}</small>}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Evergreen. Room for what’s next.
        </span>
        <span>
          Banking demonstration · No real funds · No institutional affiliation
        </span>
        <span>EN / English</span>
      </div>
    </footer>
  )
}

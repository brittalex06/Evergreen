import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { logout, updateUser, login } from '@netlify/identity'
import type { User } from '@netlify/identity'
import {
  LayoutDashboard,
  UserRound,
  List,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ShieldCheck,
  Landmark,
  TrendingUp,
  Link2,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  ChevronRight,
  FileCheck,
  Users,
  Leaf,
  Mail,
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import {
  Brand,
  Field,
  SelectField,
  Countries,
  ButtonLink,
  api,
  money,
} from './evergreen'
type Profile = {
  id: string
  email: string
  name: string
  balance: number
  createdAt: string
  data: Record<string, unknown>
}
type Application = {
  id: string
  userId: string
  kind: string
  status: string
  notes: string
  data: Record<string, unknown>
  createdAt: string
}
type Transaction = {
  id: string
  description: string
  amount: number
  createdAt: string
}
type AccountData = {
  profile: Profile
  transactions: Transaction[]
  applications: Application[]
  isAdmin: boolean
  wallets: { symbol: string; address: string; network: string }[]
}
type AdminData = {
  profiles: Profile[]
  applications: Application[]
  wallets: { symbol: string; address: string; network: string }[]
  inquiries: {
    id: string
    kind: string
    email: string
    data: Record<string, unknown>
    createdAt: string
  }[]
}
const nav = [
  ['', 'Dashboard', LayoutDashboard],
  ['profile', 'My Account', UserRound],
  ['summary', 'Account Summary', List],
  ['transfer', 'Send Money', ArrowUpRight],
  ['cards', 'Virtual Cards', CreditCard],
  ['kyc', 'KYC Status', ShieldCheck],
  ['loan', 'Loan / Credit', Landmark],
  ['invest', 'Investment', TrendingUp],
  ['link-card', 'Link Card', Link2],
  ['settings', 'Settings', Settings],
] as const
const adminNav = [
  ['', 'Overview', LayoutDashboard],
  ['clients', 'All Users', Users],
  ['kycrequests', 'KYC Requests', ShieldCheck],
  ['card-applications', 'Card Applications', CreditCard],
  ['loan-requests', 'Loan Requests', Landmark],
  ['settings', 'Wallet Settings', Settings],
] as const
export function Workspace({
  path,
  user,
  ready,
}: {
  path: string
  user: User | null
  ready: boolean
}) {
  const admin = path.startsWith('/admin')
  const page = path.split('/')[2] || ''
  const [data, setData] = useState<AccountData | null>(null)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [error, setError] = useState('')
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  async function load() {
    setLoading(true)
    setError('')
    try {
      const b = await api('me')
      setData(b)
      if (admin && b.isAdmin) setAdminData(await api('admin-data'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (user) void load()
  }, [user, admin])
  useEffect(() => {
    if (!mobile) return
    const previous = document.activeElement as HTMLElement | null
    const first = document.querySelector<HTMLElement>('.sidebar a')
    first?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobile(false)
    }
    document.addEventListener('keydown', escape)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', escape)
      previous?.focus()
    }
  }, [mobile])
  if (!ready)
    return (
      <div className="workspace loading-screen">
        <div className="skeleton" />
        <p>Opening your Evergreen workspace…</p>
      </div>
    )
  if (!user)
    return (
      <div className="workspace locked">
        <Brand />
        <ShieldCheck size={42} />
        <h1>Your world, protected.</h1>
        <p>
          Sign in to access{' '}
          {admin ? 'the administrator workspace' : 'your account'}.
        </p>
        <ButtonLink href="/login">Sign in</ButtonLink>
        <a href="/">Back to Evergreen</a>
      </div>
    )
  if (admin && !user.roles?.includes('admin'))
    return (
      <div className="workspace locked">
        <Brand />
        <ShieldCheck size={42} />
        <h1>Administrator access required</h1>
        <p>This workspace is available only to authorized staff.</p>
        <ButtonLink href="/account">Return to your account</ButtonLink>
      </div>
    )
  const items = admin ? adminNav : nav
  const current =
    items.find((n) => n[0] === page)?.[1] ||
    (page === 'deposit' ? 'Deposit Funds' : 'Account')
  return (
    <div className={'workspace ' + (admin ? 'admin-workspace' : '')}>
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <Brand />
        <button
          className="mobile-toggle"
          aria-label="Close sidebar"
          onClick={() => setMobile(false)}
        >
          <X />
        </button>
        <span className="sidebar-caption">
          {admin ? 'ADMINISTRATION' : 'YOUR FINANCIAL WORLD'}
        </span>
        <nav aria-label="Workspace navigation">
          {items.map(([slug, label, Icon]) => (
            <a
              className={page === slug ? 'selected' : ''}
              href={(admin ? '/admin' : '/account') + (slug ? '/' + slug : '')}
              key={slug}
            >
              <Icon size={18} />
              {label}
              {page === slug && <ChevronRight size={14} />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-tag">
            <Leaf size={15} /> SIMULATED BANKING
          </div>
          <p>No real funds. Room to explore.</p>
          <a href="/contact">
            <Mail size={16} /> Get help
          </a>
          {admin && (
            <a href="/account">
              Account workspace <ArrowUpRight size={16} />
            </a>
          )}
          {data?.isAdmin && !admin && (
            <a href="/admin">
              Administration <ArrowUpRight size={16} />
            </a>
          )}
          <button
            onClick={async () => {
              await logout()
              window.location.href = '/login'
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            className="mobile-toggle"
            aria-label="Open sidebar"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <span>
            {admin ? 'Evergreen administration' : 'Personal workspace'}{' '}
            <ChevronRight size={13} /> {current}
          </span>
          {admin && (
            <label className="workspace-search">
              <Search size={16} />
              <input
                aria-label="Search users"
                placeholder="Search name, email or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          )}
          <a
            className="user-avatar"
            href={admin ? '/admin/settings' : '/account/profile'}
            aria-label="Profile"
          >
            {(data?.profile.name || user.name || 'E').charAt(0)}
          </a>
        </header>
        <main className="workspace-content">
          <div className="workspace-title">
            <div>
              <span className="eyebrow">
                {admin ? 'A CLEARER VIEW' : 'GOOD TO SEE YOU'}
              </span>
              <h1>
                {page
                  ? current
                  : admin
                    ? 'Your overview.'
                    : `Hello, ${(data?.profile.name || user.name || 'there').split(' ')[0]}.`}
              </h1>
              <p>
                {admin
                  ? 'Manage fictional accounts and review simulated applications.'
                  : 'A little clarity. A world of possibilities.'}
              </p>
            </div>
            <span className="demo-pill">
              <span /> Demonstration account
            </span>
          </div>
          {error && (
            <div className="error-notice" role="alert">
              {error} <button onClick={load}>Try again</button>
            </div>
          )}
          {loading && !data ? (
            <div className="skeleton-grid">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : admin && adminData ? (
            <AdminView
              page={page}
              data={adminData}
              refresh={load}
              search={search}
            />
          ) : !admin && data ? (
            <AccountView page={page} data={data} refresh={load} />
          ) : !error ? (
            <p>Loading your workspace…</p>
          ) : null}
          <p className="workspace-disclaimer">
            Evergreen is an independent banking demonstration. Balances,
            transactions, applications, and investment figures are simulated. Do
            not submit real identity or payment information.
          </p>
        </main>
      </div>
    </div>
  )
}
function Panel({
  children,
  title,
  className = '',
}: {
  children: ReactNode
  title?: string
  className?: string
}) {
  return (
    <section className={'workspace-panel ' + className}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  )
}
function Transactions({ rows }: { rows: Transaction[] }) {
  return !rows.length ? (
    <div className="empty-state">
      <ArrowUpRight size={30} />
      <h3>A fresh page.</h3>
      <p>Your simulated transactions appear here after your first move.</p>
      <a href="/account/transfer">
        Explore transfers <ArrowUpRight size={14} />
      </a>
    </div>
  ) : (
    <div className="transaction-list">
      {rows.map((t) => (
        <div key={t.id}>
          <span
            className={'transaction-icon ' + (t.amount > 0 ? 'credit' : '')}
          >
            {t.amount > 0 ? (
              <ArrowDownLeft size={19} />
            ) : (
              <ArrowUpRight size={19} />
            )}
          </span>
          <div>
            <strong>{t.description}</strong>
            <small>
              {new Date(t.createdAt).toLocaleDateString()} · Simulated ·
              Completed
            </small>
          </div>
          <b className={t.amount > 0 ? 'positive' : ''}>
            {t.amount > 0 ? '+' : ''}
            {money(t.amount)}
          </b>
        </div>
      ))}
    </div>
  )
}
function AccountView({
  page,
  data,
  refresh,
}: {
  page: string
  data: AccountData
  refresh: () => Promise<void>
}) {
  const [visible, setVisible] = useState(true)
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState('Crypto')
  const [method, setMethod] = useState('PayPal')
  const [depositCurrency, setDepositCurrency] = useState('BTC')
  const [confirm, setConfirm] = useState<Record<string, unknown> | null>(null)
  const [busy, setBusy] = useState(false)
  const p = data.profile
  const d = p.data
  async function mutate(path: string, body: unknown) {
    setBusy(true)
    setNotice('')
    try {
      const r = await api(path, body)
      setNotice(r.message)
      setConfirm(null)
      await refresh()
    } catch (e) {
      setNotice((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  function values(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    return Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >
  }
  const demoWallet = data.wallets?.find((w) => w.symbol === depositCurrency)
  const formNotice = notice ? (
    <p className="form-notice full" role="status">
      {notice}
    </p>
  ) : null
  if (!page)
    return (
      <>
        <div className="account-overview">
          <Panel className="balance-panel">
            <span>
              AVAILABLE DEMO BALANCE{' '}
              <button
                aria-label={visible ? 'Hide balance' : 'Show balance'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </span>
            <strong className="balance">
              {visible ? money(p.balance) : '••••••'}
            </strong>
            <small>USD · {String(d.accountType || 'Personal Account')}</small>
            <div className="balance-actions">
              <a className="button" href="/account/transfer">
                <ArrowUpRight size={16} />
                Transfer
              </a>
              <a className="button secondary" href="/account/deposit">
                <Plus size={16} />
                Deposit
              </a>
            </div>
            <Leaf className="balance-leaf" size={180} />
          </Panel>
          <Panel title="Your everyday account">
            <span className="status approved">Active · Demo</span>
            <div className="account-detail">
              <span>Account holder</span>
              <strong>{p.name}</strong>
            </div>
            <div className="account-detail">
              <span>Account level</span>
              <strong>Level {String(d.accountLevel || 1)}</strong>
            </div>
            <div className="account-detail">
              <span>Account reference</span>
              <strong>DEMO · {p.id.slice(0, 8).toUpperCase()}</strong>
            </div>
            <a href="/account/profile" className="text-link">
              Your account details <ArrowUpRight size={15} />
            </a>
          </Panel>
        </div>
        <div className="dashboard-lower">
          <Panel>
            <div className="panel-heading">
              <h2>Recent activity</h2>
              <a href="/account/summary">
                View all <ArrowUpRight size={14} />
              </a>
            </div>
            <Transactions rows={data.transactions.slice(0, 5)} />
          </Panel>
          <Panel className="next-step">
            <ShieldCheck size={32} />
            <h2>A good next step.</h2>
            <p>
              Explore account verification with fictional documents. Keep your
              real personal information private.
            </p>
            <a className="button secondary" href="/account/kyc">
              View KYC status <ArrowUpRight size={15} />
            </a>
          </Panel>
        </div>
      </>
    )
  if (page === 'summary')
    return (
      <Panel title="Transaction history">
        <p>All activity below belongs to your simulated account.</p>
        <Transactions rows={data.transactions} />
      </Panel>
    )
  if (page === 'profile')
    return (
      <Panel title="Your details">
        <p>Please use fictional information in this demo.</p>
        <form
          className="form-grid"
          onSubmit={(e) => {
            const v = values(e)
            void mutate('profile', v)
          }}
        >
          <PhotoUpload
            current={String(d.photo || '')}
            onSaved={(key) => void mutate('profile', { photo: key })}
          />
          <Field
            label="First name"
            name="firstName"
            defaultValue={String(d.firstName || p.name.split(' ')[0])}
          />
          <Field
            label="Last name"
            name="lastName"
            defaultValue={String(
              d.lastName || p.name.split(' ').slice(1).join(' '),
            )}
          />
          <Field
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            defaultValue={String(d.dateOfBirth || '')}
          />
          <Field
            label="Phone"
            name="phone"
            defaultValue={String(d.phone || '')}
          />
          <Field
            label="Address"
            name="address"
            defaultValue={String(d.address || '')}
          />
          <Countries />
          {['state', 'city', 'postcode', 'occupation'].map((k) => (
            <Field
              key={k}
              name={k}
              label={k[0].toUpperCase() + k.slice(1)}
              defaultValue={String(d[k] || '')}
            />
          ))}
          <SelectField
            label="Income range"
            name="income"
            options={[
              'Under $25,000',
              '$25,000–$50,000',
              '$50,000–$100,000',
              '$100,000+',
            ]}
            defaultValue={String(d.income || 'Under $25,000')}
          />
          <SelectField
            label="Account type"
            name="accountType"
            options={[
              'Personal Account',
              'Business Account',
              'Savings Account',
            ]}
            defaultValue={String(d.accountType || 'Personal Account')}
          />
          <SelectField
            label="Preferred currency"
            name="currency"
            options={['USD', 'GBP', 'EUR']}
            defaultValue={String(d.currency || 'USD')}
          />
          <div className="full readonly-row">
            Email: {p.email} · Account level: {String(d.accountLevel || 1)}
            <a href="/account/settings">Change password</a>
          </div>
          <button className="button" disabled={busy}>
            Save profile <Check size={16} />
          </button>
          {formNotice}
        </form>
      </Panel>
    )
  if (page === 'transfer')
    return (
      <Panel title="Withdraw funds">
        <p>A transparent simulation. No money leaves this demonstration.</p>
        <div className="inline-balance">
          Available balance <strong>{money(p.balance)}</strong>
        </div>
        <form
          className="form-grid"
          onSubmit={(e) => {
            const v = values(e)
            setNotice('')
            setConfirm({ ...v, consent: true })
          }}
        >
          <label>
            Transfer method
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              name="method"
            >
              {[
                'PayPal',
                'CashApp',
                'GCash',
                'USA Bank',
                'Local Bank',
                'Crypto',
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Field
            label={
              method === 'Crypto'
                ? 'Fictional wallet reference'
                : method.includes('Bank')
                  ? 'Fictional bank / account reference'
                  : 'Fictional recipient email or handle'
            }
            name="recipient"
          />
          {method.includes('Bank') && (
            <div className="full info-panel">
              Use a fictional routing/account reference only. This form does not
              connect to a bank.
            </div>
          )}
          <Field
            label="Amount (USD)"
            name="amount"
            type="number"
            min={0.01}
            max={p.balance / 100}
          />
          <Field
            label="Description (optional)"
            name="description"
            required={false}
          />
          <button className="button full">
            Review simulated transfer <ArrowUpRight size={16} />
          </button>
          {formNotice}
        </form>
        <Confirm
          error={notice}
          open={!!confirm}
          close={() => setConfirm(null)}
          title="Review your simulated transfer"
          busy={busy}
          onConfirm={() => void mutate('transfer', confirm)}
        >
          <p>
            Send {money(Math.round(Number(confirm?.amount || 0) * 100))} via{' '}
            {String(confirm?.method || '')} to{' '}
            {String(confirm?.recipient || '')}?
          </p>
          <p>This changes only your demo balance. No money is sent.</p>
        </Confirm>
      </Panel>
    )
  if (page === 'deposit')
    return (
      <>
        <Panel title="Add a little possibility">
          <div className="tabs">
            {['Crypto', 'Bank'].map((t) => (
              <button
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === 'Crypto' ? (
            <>
              <p>
                Simulated deposits only. Never send cryptocurrency to any demo
                address.
              </p>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  const v = values(e)
                  void mutate('application', {
                    kind: 'deposit',
                    data: { ...v, consent: true },
                  })
                }}
              >
                <label>
                  Currency
                  <select
                    name="currency"
                    value={depositCurrency}
                    onChange={(e) => setDepositCurrency(e.target.value)}
                  >
                    {['BTC', 'ETH', 'USDT'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <SelectField
                  name="network"
                  label="Network"
                  options={[
                    demoWallet?.network || 'Demo network — no real deposits',
                  ]}
                />
                <Field
                  name="amount"
                  label="Simulated amount (USD equivalent)"
                  type="number"
                  min={0.01}
                  max={1000000}
                />
                <Field
                  name="reference"
                  label="Fictional transaction reference"
                />
                <div className="full demo-address">
                  <code>
                    {demoWallet?.address || 'DEMO_ADDRESS_DO_NOT_SEND_FUNDS'}
                  </code>
                  <button
                    type="button"
                    aria-label="Copy demo address"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          demoWallet?.address ||
                            'DEMO_ADDRESS_DO_NOT_SEND_FUNDS',
                        )
                        setNotice('Demo address copied. Never send funds.')
                      } catch {
                        setNotice(
                          'Copy is unavailable. Select the demo address manually.',
                        )
                      }
                    }}
                  >
                    <Copy size={17} />
                  </button>
                </div>
                <button disabled={busy} className="button full">
                  Confirm simulated deposit <Check size={16} />
                </button>
                {formNotice}
              </form>
            </>
          ) : (
            <div className="empty-state">
              <Landmark size={32} />
              <h3>A conversation comes first.</h3>
              <p>
                Bank deposits are not connected. Contact the demo support inbox
                for general enquiries. No live chat is available.
              </p>
              <ButtonLink href="/contact">Contact support</ButtonLink>
            </div>
          )}
        </Panel>
        <Applications
          rows={data.applications.filter((a) => a.kind === 'deposit')}
          title="Deposit history"
        />
      </>
    )
  if (page === 'settings')
    return (
      <>
        <Panel title="Account information">
          <div className="details-grid">
            <div>
              <small>Name</small>
              <strong>{p.name}</strong>
            </div>
            <div>
              <small>Email</small>
              <strong>{p.email}</strong>
            </div>
            <div>
              <small>Member since</small>
              <strong>{new Date(p.createdAt).toLocaleDateString()}</strong>
            </div>
          </div>
        </Panel>
        <PasswordChange email={p.email} />
        <Panel title="Stay connected">
          <form
            onSubmit={(e) => {
              const v = values(e)
              void mutate(
                'profile',
                Object.fromEntries(
                  [
                    'emailUpdates',
                    'transactionAlerts',
                    'securityAlerts',
                    'promotionalEmail',
                  ].map((k) => [k, v[k] === 'on']),
                ),
              )
            }}
          >
            {[
              ['emailUpdates', 'Evergreen email updates'],
              ['transactionAlerts', 'Transaction alerts'],
              ['securityAlerts', 'Security alerts'],
              ['promotionalEmail', 'Promotional email'],
            ].map(([k, l]) => (
              <label key={k} className="toggle-row">
                <span>
                  {l}
                  <small>
                    Preference saved; notification delivery is not connected.
                  </small>
                </span>
                <input
                  type="checkbox"
                  name={k}
                  defaultChecked={d[k] !== false}
                />
              </label>
            ))}
            <button className="button" disabled={busy}>
              Save preferences
            </button>
            {formNotice}
          </form>
        </Panel>
        <Panel title="Sign out">
          <p>Leave this session and come back when you’re ready.</p>
          <button
            className="button secondary"
            onClick={async () => {
              await logout()
              window.location.href = '/login'
            }}
          >
            Sign out <LogOut size={16} />
          </button>
        </Panel>
      </>
    )
  if (page === 'invest')
    return (
      <>
        <div className="stat-grid">
          <Stat label="Available demo balance" value={money(p.balance)} />
          <Stat
            label="Total sample investments"
            value={money(
              data.applications
                .filter((a) => a.kind === 'invest')
                .reduce(
                  (s, a) => s + Math.round(Number(a.data.amount) * 100),
                  0,
                ),
            )}
          />
          <Stat label="Simulated returns" value="$0.00" />
        </div>
        <p className="info-panel">
          Fictional plans for exploring the interface. No investment advice,
          promised returns, or real assets.
        </p>
        <div className="plan-grid">
          {[
            ['Steady Roots', 'A sample balanced portfolio', '12 months'],
            ['New Horizons', 'A sample growth portfolio', '24 months'],
            ['Long View', 'A sample diversified portfolio', '36 months'],
          ].map(([plan, text, duration], i) => (
            <Panel key={plan} title={plan}>
              <span className="plan-icon">
                <TrendingUp size={26} />
              </span>
              <p>{text}</p>
              <p>
                Sample duration: {duration}
                <br />
                Illustrative scenario: {i + 2}.4% annually
                <br />
                Actual performance: not applicable
              </p>
              <form
                onSubmit={(e) => {
                  const v = values(e)
                  setNotice('')
                  setConfirm({ plan, amount: v.amount, consent: true })
                }}
              >
                <Field
                  label="Sample amount (USD)"
                  name="amount"
                  type="number"
                  min={100}
                  max={p.balance / 100}
                />
                <button className="button">
                  Explore this plan <ArrowUpRight size={16} />
                </button>
              </form>
            </Panel>
          ))}
        </div>
        {formNotice}
        <Applications
          title="Your sample investments"
          rows={data.applications.filter((a) => a.kind === 'invest')}
        />
        <Confirm
          error={notice}
          open={!!confirm}
          close={() => setConfirm(null)}
          title="Confirm a sample investment"
          busy={busy}
          onConfirm={() =>
            void mutate('application', { kind: 'invest', data: confirm })
          }
        >
          <p>
            Allocate {money(Math.round(Number(confirm?.amount || 0) * 100))} of
            your simulated balance to {String(confirm?.plan || '')}? No assets
            are purchased or returns guaranteed.
          </p>
        </Confirm>
      </>
    )
  if (['cards', 'kyc', 'loan', 'link-card'].includes(page))
    return (
      <>
        <Panel
          title={
            page === 'cards'
              ? 'A card for your possibilities.'
              : page === 'kyc'
                ? 'A clearer picture of you.'
                : page === 'loan'
                  ? 'Explore your next big step.'
                  : 'Link a test card.'
          }
        >
          <p>
            {page === 'kyc'
              ? 'Upload fictional sample images only. Never upload real identity documents.'
              : page === 'link-card'
                ? 'Token-only demonstration. Full card numbers and CVV are never requested or stored.'
                : 'A simulated application only. No real card issuance, credit decision, or financial product.'}
          </p>
          <ApplicationForm
            kind={page}
            busy={busy}
            submit={(body) =>
              void mutate('application', { kind: page, data: body })
            }
          />
          {formNotice}
        </Panel>
        <Applications
          title="Application status"
          rows={data.applications.filter((a) => a.kind === page)}
        />
      </>
    )
  return (
    <Panel title="Let’s find your next step.">
      <p>This account destination is not available.</p>
      <ButtonLink href="/account">Back to dashboard</ButtonLink>
    </Panel>
  )
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <small>{label}</small>
      <strong className="stat-value">{value}</strong>
      <span className="stat-foot">
        Simulated data <ArrowUpRight size={14} />
      </span>
    </Panel>
  )
}
function Confirm({
  open,
  close,
  title,
  children,
  busy,
  onConfirm,
  error,
}: {
  error?: string
  open: boolean
  close: () => void
  title: string
  children: ReactNode
  busy: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) close()
      }}
    >
      <DialogContent className="evergreen-dialog">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Review the details before updating the demo ledger.
        </DialogDescription>
        {children}
        {error && (
          <p className="form-notice" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button className="button secondary" onClick={close} disabled={busy}>
            Cancel
          </button>
          <button className="button" disabled={busy} onClick={onConfirm}>
            {busy ? 'Saving…' : 'Confirm simulation'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
async function upload(file: File) {
  if (
    !['image/png', 'image/jpeg', 'image/gif'].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error('Use a PNG, JPG, or GIF smaller than 5 MB.')
  const form = new FormData()
  form.set('file', file)
  const r = await fetch('/api/banking/upload', { method: 'POST', body: form })
  const b = await r.json()
  if (!r.ok) throw new Error(b.error)
  return b.key as string
}
function PhotoUpload({
  current,
  onSaved,
}: {
  current: string
  onSaved: (key: string) => void
}) {
  const [notice, setNotice] = useState('')
  return (
    <div className="full profile-upload">
      {current ? (
        <img
          src={'/api/banking/document?key=' + encodeURIComponent(current)}
          alt="Your sample profile"
        />
      ) : (
        <UserRound size={40} />
      )}
      <label>
        Sample profile photo
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif"
          onChange={async (e) => {
            if (!e.target.files?.[0]) return
            setNotice('Uploading…')
            try {
              onSaved(await upload(e.target.files[0]))
              setNotice('Photo uploaded.')
            } catch (e) {
              setNotice((e as Error).message)
            }
          }}
        />
        <small>PNG, JPG, or GIF · up to 5 MB · fictional photo only</small>
      </label>
      <span role="status">{notice}</span>
    </div>
  )
}
function ApplicationForm({
  kind,
  busy,
  submit,
}: {
  kind: string
  busy: boolean
  submit: (body: Record<string, unknown>) => void
}) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.currentTarget))
    setError('')
    const body = {
      ...v,
      consent: v.consent === 'on',
      ...(kind === 'cards' || kind === 'kyc'
        ? { accuracy: v.accuracy === 'on' }
        : {}),
      ...(kind === 'kyc' ? { front, back } : {}),
    }
    if (kind === 'kyc' && (!front || !back)) {
      setError('Upload both fictional document images.')
      return
    }
    submit(body)
  }
  return (
    <form className="form-grid" onSubmit={send}>
      {kind === 'cards' && (
        <>
          <Field label="First name" name="firstName" />
          <Field label="Last name" name="lastName" />
          <Field label="Email address" name="email" type="email" />
          <Field label="Phone" name="phone" />
          <Field label="Fictional address" name="address" />
          <Countries />
          <Field label="City" name="city" />
          <Field label="Postcode" name="postcode" />
          <SelectField
            label="Card network"
            name="cardType"
            options={['Visa', 'MasterCard', 'Discover']}
          />
          <div className="full info-panel">
            Security answers are not collected. This demonstration never issues
            a real card.
          </div>
        </>
      )}
      {kind === 'kyc' && (
        <>
          <SelectField
            label="Document type"
            name="documentType"
            options={['Passport', 'National ID', 'Driving License']}
          />
          <Field label="Date of birth" name="dateOfBirth" type="date" />
          {['front', 'back'].map((side) => (
            <label key={side}>
              Sample document — {side}
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif"
                required
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  setError('')
                  try {
                    const key = await upload(file)
                    if (side === 'front') setFront(key)
                    else setBack(key)
                  } catch (e) {
                    setError((e as Error).message)
                  } finally {
                    setUploading(false)
                  }
                }}
              />
              <small>PNG/JPG/GIF, up to 5 MB. Fictional samples only.</small>
            </label>
          ))}
          <Field label="Fictional address" name="address" />
          <Field label="Occupation" name="occupation" />
          <SelectField
            label="Income range"
            name="income"
            options={[
              'Under $25,000',
              '$25,000–$50,000',
              '$50,000–$100,000',
              '$100,000+',
            ]}
          />
        </>
      )}
      {kind === 'loan' && (
        <>
          <Field
            label="Loan amount (USD) · $5,000 minimum"
            name="amount"
            type="number"
            min={5000}
            max={1000000}
          />
          <Field
            label="Monthly net salary (USD)"
            name="salary"
            type="number"
            min={1}
          />
          <SelectField
            label="Payday"
            name="payday"
            options={Array.from({ length: 31 }, (_, i) => String(i + 1))}
          />
          <SelectField
            label="Credit facility"
            name="facility"
            options={[
              'Personal loan',
              'Business loan',
              'Education loan',
              'Mortgage preview',
            ]}
          />
          <SelectField
            label="Tenure"
            name="tenure"
            options={['6 months', '12 months', '24 months', '36 months']}
          />
          <label>
            Purpose
            <textarea name="purpose" required maxLength={2000} />
          </label>
          <div className="full info-panel">
            Disbursement: your simulated Evergreen account. Approval only
            changes the demo balance.
          </div>
        </>
      )}
      {kind === 'link-card' && (
        <>
          <SelectField
            label="Test card network"
            name="cardType"
            options={['Visa']}
          />
          <SelectField
            label="Test payment token"
            name="testToken"
            options={['tok_demo_visa']}
          />
          <div className="test-card full">
            <Brand />
            <CreditCard size={30} />
            <strong>DEMO •••• •••• 4242</strong>
            <small>EVERGREEN TEST CARD · NO PAYMENT CAPABILITY</small>
          </div>
        </>
      )}
      {(kind === 'kyc' || kind === 'cards') && (
        <label className="check-label full">
          <input type="checkbox" required name="accuracy" />I confirm these are
          fictional sample details, provided accurately for this demo.
        </label>
      )}
      <label className="check-label full">
        <input type="checkbox" required name="consent" />I consent to storing
        this simulated application and understand no financial service is
        provided.
      </label>
      <button className="button full" disabled={busy || uploading}>
        {busy || uploading ? 'Saving…' : 'Submit simulated application'}
        <ArrowUpRight size={16} />
      </button>
      {error && (
        <p className="form-notice full" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
function Applications({ rows, title }: { rows: Application[]; title: string }) {
  return (
    <Panel title={title}>
      {!rows.length ? (
        <div className="empty-state">
          <FileCheck size={28} />
          <h3>Nothing to review yet.</h3>
          <p>Your simulated requests appear here after submission.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Request</th>
                <th>Details</th>
                <th>Status</th>
                <th>Review notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>{a.kind}</td>
                  <td>
                    {a.data.amount
                      ? money(Math.round(Number(a.data.amount) * 100))
                      : String(
                          a.data.cardType ||
                            a.data.documentType ||
                            'Demo application',
                        )}
                    {a.kind === 'deposit' && (
                      <small>
                        {String(a.data.currency)} · {String(a.data.network)}
                        <br />
                        Reference: {String(a.data.reference || 'Not provided')}
                      </small>
                    )}
                    {a.kind === 'invest' && (
                      <small>{String(a.data.plan)} · No real returns</small>
                    )}
                  </td>
                  <td>
                    <span className={'status ' + a.status}>{a.status}</span>
                  </td>
                  <td>{a.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
function PasswordChange({ email }: { email: string }) {
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >
    if (
      v.password !== v.confirm ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}/.test(v.password)
    ) {
      setNotice(
        'Use matching passwords of 12+ characters, with upper and lower case letters and a number.',
      )
      return
    }
    setBusy(true)
    try {
      await login(email, v.current)
      await updateUser({ password: v.password })
      setNotice('Password updated.')
    } catch {
      setNotice(
        'Unable to change password. Check your current password and try again.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <Panel title="Security">
      <form className="form-grid" onSubmit={save}>
        <Field name="current" label="Current password" type="password" />
        <Field name="password" label="New password" type="password" />
        <Field name="confirm" label="Confirm new password" type="password" />
        <small className="full">
          Use 12+ characters with upper and lower case letters and a number.
        </small>
        <button className="button" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
        {notice && (
          <p className="form-notice full" role="status">
            {notice}
          </p>
        )}
      </form>
    </Panel>
  )
}
function AdminView({
  page,
  data,
  refresh,
  search,
}: {
  page: string
  data: AdminData
  refresh: () => Promise<void>
  search: string
}) {
  const [filter, setFilter] = useState('all')
  const [localSearch, setLocalSearch] = useState('')
  const [selected, setSelected] = useState<Application | null>(null)
  const [client, setClient] = useState<Profile | null>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [editing, setEditing] = useState(false)
  const query = (search || localSearch).toLowerCase()
  const users = data.profiles
    .filter((p) =>
      (p.name + ' ' + p.email + ' ' + String(p.data.phone || ''))
        .toLowerCase()
        .includes(query),
    )
    .filter(
      (p) =>
        filter === 'all' ||
        data.applications.some(
          (a) =>
            a.userId === p.id &&
            (filter === 'KYC Pending'
              ? a.kind === 'kyc' && a.status === 'pending'
              : filter === 'KYC Approved'
                ? a.kind === 'kyc' && a.status === 'approved'
                : filter === 'Card Pending'
                  ? a.kind === 'cards' && a.status === 'pending'
                  : true),
        ),
    )
  const kind =
    page === 'kycrequests'
      ? 'kyc'
      : page === 'card-applications'
        ? 'cards'
        : 'loan'
  const rows = data.applications
    .filter(
      (a) =>
        (a.kind === kind || (kind === 'cards' && a.kind === 'link-card')) &&
        (filter === 'all' || a.status === filter),
    )
    .filter((a) => {
      const p = data.profiles.find((p) => p.id === a.userId)
      return ((p?.name || '') + ' ' + (p?.email || ''))
        .toLowerCase()
        .includes(query)
    })
  async function review(e: FormEvent<HTMLFormElement>, status: string) {
    e.preventDefault()
    if (!selected) return
    const f = e.currentTarget
    setBusy(true)
    try {
      const r = await api('admin-review', {
        id: selected.id,
        status,
        notes: String(new FormData(f).get('notes') || ''),
      })
      setNotice(r.message)
      setSelected(null)
      await refresh()
    } catch (e) {
      setNotice((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const userTable = (
    <>
      <div className="table-tools">
        <label className="workspace-search">
          <Search size={16} />
          <input
            aria-label="Search clients"
            placeholder="Name, email, or phone"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value)
              setPageIndex(0)
            }}
          />
        </label>
        <label>
          Filter
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPageIndex(0)
            }}
          >
            {['all', 'KYC Pending', 'KYC Approved', 'Card Pending'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email / Phone</th>
              <th>Demo balance</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(pageIndex * 8, pageIndex * 8 + 8).map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  {p.email}
                  <small>{String(p.data.phone || '—')}</small>
                </td>
                <td>{money(p.balance)}</td>
                <td>
                  <span className="status approved">Active demo</span>
                </td>
                <td>
                  <button className="text-link" onClick={() => setClient(p)}>
                    View <ArrowUpRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <div className="empty-state">No matching users.</div>}
      </div>
      <Pagination
        count={users.length}
        page={pageIndex}
        setPage={setPageIndex}
      />
    </>
  )
  return (
    <>
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      {!page ? (
        <>
          <div className="stat-grid">
            <Stat label="Total users" value={String(data.profiles.length)} />
            <Stat
              label="Pending KYC"
              value={String(
                data.applications.filter(
                  (a) => a.kind === 'kyc' && a.status === 'pending',
                ).length,
              )}
            />
            <Stat
              label="Card applications"
              value={String(
                data.applications.filter((a) => a.kind === 'cards').length,
              )}
            />
            <Stat
              label="Loan requests"
              value={String(
                data.applications.filter((a) => a.kind === 'loan').length,
              )}
            />
          </div>
          <Panel>
            <div className="panel-heading">
              <h2>Recently joined users</h2>
              <a href="/admin/clients">
                View all users <ArrowUpRight size={14} />
              </a>
            </div>
            {userTable}
          </Panel>
          <Panel title="Pending simulated deposits">
            <p>
              Reviewing a deposit adds fictional funds only. No cryptocurrency
              receipt is verified.
            </p>
            {data.applications.filter(
              (a) => a.kind === 'deposit' && a.status === 'pending',
            ).length ? (
              data.applications
                .filter((a) => a.kind === 'deposit' && a.status === 'pending')
                .map((a) => (
                  <div className="inquiry" key={a.id}>
                    <strong>
                      {data.profiles.find((p) => p.id === a.userId)?.name} ·{' '}
                      {money(Math.round(Number(a.data.amount) * 100))}
                    </strong>
                    <button
                      className="text-link"
                      onClick={() => {
                        setNotice('')
                        setSelected(a)
                      }}
                    >
                      Review <ArrowUpRight size={15} />
                    </button>
                  </div>
                ))
            ) : (
              <div className="empty-state">No deposits awaiting review.</div>
            )}
          </Panel>
          <Panel title="Demo support inbox">
            <p>
              Saved contact and newsletter interest. Email delivery is not
              connected.
            </p>
            {!data.inquiries.length ? (
              <div className="empty-state">Your inbox is clear.</div>
            ) : (
              data.inquiries.map((i) => (
                <article className="inquiry" key={i.id}>
                  <strong>
                    {String(i.data.subject || 'Newsletter interest')} ·{' '}
                    {i.email}
                  </strong>
                  <p>
                    {String(
                      i.data.message || 'Registered newsletter interest.',
                    )}
                  </p>
                  <small>
                    {new Date(i.createdAt).toLocaleString()} · {i.kind}
                  </small>
                </article>
              ))
            )}
          </Panel>
        </>
      ) : page === 'clients' ? (
        <Panel title={`All users · ${data.profiles.length}`}>{userTable}</Panel>
      ) : page === 'settings' ? (
        <Panel title="Crypto wallet settings">
          <p>
            Only fictional addresses beginning with DEMO_ are accepted. No real
            cryptocurrency is processed.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Demo address</th>
                  <th>Network</th>
                </tr>
              </thead>
              <tbody>
                {data.wallets.map((w) => (
                  <tr key={w.symbol}>
                    <td>{w.symbol}</td>
                    <td>{w.address}</td>
                    <td>{w.network}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.wallets.length && <p>No demo wallets configured.</p>}
          </div>
          {!editing ? (
            <button className="button" onClick={() => setEditing(true)}>
              <Plus size={16} />
              Configure demo wallet
            </button>
          ) : (
            <form
              className="form-grid"
              onSubmit={async (e) => {
                e.preventDefault()
                const v = Object.fromEntries(new FormData(e.currentTarget))
                setBusy(true)
                try {
                  const r = await api('admin-wallet', v)
                  setNotice(r.message)
                  setEditing(false)
                  await refresh()
                } catch (e) {
                  setNotice((e as Error).message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              <SelectField
                label="Symbol"
                name="symbol"
                options={['BTC', 'ETH', 'USDT']}
              />
              <Field
                label="Demo address"
                name="address"
                placeholder="DEMO_EXAMPLE_ADDRESS"
              />
              <Field label="Network" name="network" />
              <div className="dialog-actions full">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button className="button" disabled={busy}>
                  Save settings
                </button>
              </div>
            </form>
          )}
        </Panel>
      ) : ['kycrequests', 'card-applications', 'loan-requests'].includes(
          page,
        ) ? (
        <Panel
          title={
            kind === 'kyc'
              ? 'Verification requests'
              : kind === 'cards'
                ? 'Virtual card applications'
                : 'Loan requests'
          }
        >
          <div className="table-tools">
            <p>{rows.length} simulated requests</p>
            <label>
              Status
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPageIndex(0)
                }}
              >
                {['all', 'pending', 'approved', 'rejected'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>
                    {kind === 'loan' ? 'Amount / Salary' : 'Document / Card'}
                  </th>
                  {kind === 'loan' && <th>Payday / Facility / Tenure</th>}
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(pageIndex * 8, pageIndex * 8 + 8).map((a) => {
                  const p = data.profiles.find((p) => p.id === a.userId)
                  return (
                    <tr key={a.id}>
                      <td>
                        {p?.name || 'Member'}
                        <small>{p?.email}</small>
                      </td>
                      <td>
                        {kind === 'loan' ? (
                          <>
                            {money(Math.round(Number(a.data.amount) * 100))}
                            <small>
                              Salary{' '}
                              {money(Math.round(Number(a.data.salary) * 100))}
                            </small>
                          </>
                        ) : (
                          String(
                            a.data.documentType || a.data.cardType || 'Demo',
                          )
                        )}
                      </td>
                      {kind === 'loan' && (
                        <td>
                          {String(a.data.payday)} / {String(a.data.facility)} /{' '}
                          {String(a.data.tenure)}
                        </td>
                      )}
                      <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={'status ' + a.status}>{a.status}</span>
                      </td>
                      <td>
                        <button
                          className="text-link"
                          onClick={() => {
                            setNotice('')
                            setSelected(a)
                          }}
                        >
                          Review <ArrowUpRight size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!rows.length && (
              <div className="empty-state">
                <FileCheck size={28} />
                <h3>All clear for now.</h3>
                <p>No matching requests.</p>
              </div>
            )}
          </div>
          <Pagination
            count={rows.length}
            page={pageIndex}
            setPage={setPageIndex}
          />
        </Panel>
      ) : (
        <Panel title="Page unavailable">
          <a href="/admin">Return to overview</a>
        </Panel>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v && !busy) setSelected(null)
        }}
      >
        <DialogContent className="evergreen-dialog">
          <DialogTitle>
            Review simulated {selected?.kind} application
          </DialogTitle>
          <DialogDescription>
            Only authorized staff can access this fictional application.
          </DialogDescription>
          {selected && (
            <form onSubmit={(e) => void review(e, 'approved')}>
              <div className="review-data">
                {Object.entries(selected.data)
                  .filter(
                    ([k]) =>
                      !['front', 'back', 'consent', 'accuracy'].includes(k),
                  )
                  .map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <strong>{String(v)}</strong>
                    </div>
                  ))}
              </div>
              {selected.kind === 'kyc' && (
                <div className="document-previews">
                  {['front', 'back'].map((k) => (
                    <a
                      key={k}
                      href={
                        '/api/banking/document?key=' +
                        encodeURIComponent(String(selected.data[k] || ''))
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={
                          '/api/banking/document?key=' +
                          encodeURIComponent(String(selected.data[k] || ''))
                        }
                        alt={'Fictional sample document ' + k}
                      />
                      <span>View {k}</span>
                    </a>
                  ))}
                </div>
              )}
              <label>
                Review notes
                <textarea
                  name="notes"
                  maxLength={2000}
                  defaultValue={selected.notes}
                />
              </label>
              {selected.status === 'pending' ? (
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="button secondary"
                    disabled={busy}
                    onClick={(e) => {
                      const f = e.currentTarget.closest('form')
                      if (f)
                        void review(
                          {
                            preventDefault: () => {},
                            currentTarget: f,
                          } as FormEvent<HTMLFormElement>,
                          'rejected',
                        )
                    }}
                  >
                    Reject
                  </button>
                  <button className="button" disabled={busy}>
                    {busy ? 'Saving…' : 'Approve simulation'}
                  </button>
                </div>
              ) : (
                <p>This application is already {selected.status}.</p>
              )}
              {notice && (
                <p className="form-notice" role="alert">
                  {notice}
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!client}
        onOpenChange={(v) => {
          if (!v) setClient(null)
        }}
      >
        <DialogContent className="evergreen-dialog">
          <DialogTitle>{client?.name}</DialogTitle>
          <DialogDescription>
            Fictional user details. Financial controls are restricted to
            application review.
          </DialogDescription>
          {client && (
            <>
              <p>
                {client.email} · {String(client.data.phone || 'No phone')}
              </p>
              <h3>Demo balance: {money(client.balance)}</h3>
              <p>
                Joined {new Date(client.createdAt).toLocaleDateString()} · Level{' '}
                {String(client.data.accountLevel || 1)}
              </p>
              <p>
                {data.applications.filter((a) => a.userId === client.id).length}{' '}
                simulated applications
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
function Pagination({
  count,
  page,
  setPage,
}: {
  count: number
  page: number
  setPage: (n: number) => void
}) {
  return (
    <div className="pagination">
      <small>
        {count
          ? `${page * 8 + 1}–${Math.min(count, (page + 1) * 8)} of ${count}`
          : '0 results'}
      </small>
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <button
        disabled={(page + 1) * 8 >= count}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>
  )
}

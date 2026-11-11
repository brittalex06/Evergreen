import { getUser, verifyRequestOrigin } from '@netlify/identity'
import { getStore } from '@netlify/blobs'
import { eq, desc, and, sql } from 'drizzle-orm'
import { database } from '../../db/index'
import {
  profiles,
  applications,
  ledger,
  audits,
  inquiries,
  wallets,
} from '../../db/schema'
import { z } from 'zod'

export default async (req: Request) => {
  const profileFields = z.object({
    firstName: z.string().max(80).optional(),
    lastName: z.string().max(80).optional(),
    phone: z.string().max(40).optional(),
    dateOfBirth: z.string().max(20).optional(),
    address: z.string().max(250).optional(),
    country: z.string().max(100).optional(),
    state: z.string().max(80).optional(),
    city: z.string().max(80).optional(),
    postcode: z.string().max(30).optional(),
    occupation: z.string().max(100).optional(),
    income: z.string().max(60).optional(),
    accountType: z
      .enum(['Personal Account', 'Business Account', 'Savings Account'])
      .optional(),
    currency: z.enum(['USD', 'GBP', 'EUR']).optional(),
    emailUpdates: z.boolean().optional(),
    transactionAlerts: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
    promotionalEmail: z.boolean().optional(),
    photo: z.string().max(200).optional(),
  })
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const route = new URL(req.url).pathname.split('/').pop()
    if (route === 'transfer' && req.method === 'POST')
      return Response.json(
        { error: 'Transfers are unavailable. Evergreen is currently a non-operational financial demonstration.' },
        { status: 403, headers },
      )
    if (route === 'application' && req.method === 'POST')
      return Response.json(
        { error: 'Financial applications and account actions are disabled. No real funds, cards, loans, identity checks, or investments are processed.' },
        { status: 403, headers },
      )
    const db = database()
    if (req.method !== 'GET') verifyRequestOrigin(req)
    if (route === 'inquiry' && req.method === 'POST') {
      const b = z
        .object({
          kind: z.enum(['contact', 'newsletter']),
          email: z.email(),
          name: z.string().min(1).max(150).optional(),
          phone: z.string().max(40).optional(),
          subject: z
            .enum([
              'General Inquiry',
              'Technical Support',
              'Billing Question',
              'Feedback',
              'Partnership',
            ])
            .optional(),
          message: z.string().max(5000).optional(),
          website: z.string().max(0).optional(),
        })
        .parse(await req.json())
      if (b.kind === 'contact' && (!b.name || !b.subject || !b.message))
        return Response.json(
          { error: 'Complete all required fields.' },
          { status: 400, headers },
        )
      await db
        .insert(inquiries)
        .values({ kind: b.kind, email: b.email, data: b })
      return Response.json(
        {
          message:
            b.kind === 'contact'
              ? 'Your inquiry was saved to the demo support inbox. Email delivery is not connected.'
              : 'Your newsletter interest was saved. Campaign delivery is not connected.',
        },
        { headers },
      )
    }
    const user = await getUser()
    if (!user)
      return Response.json(
        { error: 'Please sign in to continue.' },
        { status: 401, headers },
      )
    const isAdmin = !!user.roles?.includes('admin')
    if (route?.startsWith('admin') && !isAdmin)
      return Response.json(
        { error: 'An administrator role is required.' },
        { status: 403, headers },
      )
    await db.transaction(async (tx) => {
      const meta = user.userMetadata || {}
      const profileData = profileFields.parse({
        firstName:
          typeof meta.first_name === 'string' ? meta.first_name : undefined,
        lastName:
          typeof meta.last_name === 'string' ? meta.last_name : undefined,
        phone: typeof meta.phone === 'string' ? meta.phone : undefined,
        country: typeof meta.country === 'string' ? meta.country : undefined,
        accountType: [
          'Personal Account',
          'Business Account',
          'Savings Account',
        ].includes(String(meta.account_type))
          ? (meta.account_type as 'Personal Account')
          : undefined,
      })
      const inserted = await tx
        .insert(profiles)
        .values({
          id: user.id,
          email: user.email || '',
          name: user.name || 'Evergreen member',
          data: profileData,
        })
        .onConflictDoNothing()
        .returning()
      if (inserted.length)
        await tx.insert(ledger).values({
          userId: user.id,
          amount: 1248050,
          description: 'Welcome · fictional opening balance',
        })
    })
    if (route === 'me' && req.method === 'GET') {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id))
      const transactions = await db
        .select()
        .from(ledger)
        .where(eq(ledger.userId, user.id))
        .orderBy(desc(ledger.createdAt))
        .limit(100)
      const requests = await db
        .select()
        .from(applications)
        .where(eq(applications.userId, user.id))
        .orderBy(desc(applications.createdAt))
      return Response.json(
        {
          profile,
          transactions,
          applications: requests,
          isAdmin,
          wallets: await db.select().from(wallets),
        },
        { headers },
      )
    }
    if (route === 'profile' && req.method === 'POST') {
      const data = profileFields.parse(await req.json())
      const [old] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id))
      await db
        .update(profiles)
        .set({
          data: { ...old.data, ...data },
          name: [
            data.firstName || old.name.split(' ')[0],
            data.lastName || old.name.split(' ').slice(1).join(' '),
          ]
            .join(' ')
            .trim(),
        })
        .where(eq(profiles.id, user.id))
      return Response.json({ message: 'Your changes were saved.' }, { headers })
    }
    if (route === 'upload' && req.method === 'POST') {
      const f = await req.formData()
      const file = f.get('file')
      if (
        !(file instanceof File) ||
        !['image/jpeg', 'image/png', 'image/gif'].includes(file.type) ||
        file.size > 5 * 1024 * 1024 ||
        !file.size
      )
        return Response.json(
          { error: 'Choose a PNG, JPG, or GIF under 5 MB.' },
          { status: 400, headers },
        )
      const bytes = new Uint8Array(await file.arrayBuffer())
      const valid =
        (file.type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216) ||
        (file.type === 'image/png' &&
          bytes[0] === 137 &&
          bytes[1] === 80 &&
          bytes[2] === 78 &&
          bytes[3] === 71) ||
        (file.type === 'image/gif' &&
          bytes[0] === 71 &&
          bytes[1] === 73 &&
          bytes[2] === 70)
      if (!valid)
        return Response.json(
          { error: 'The image contents do not match its type.' },
          { status: 400, headers },
        )
      const key =
        user.id +
        '/' +
        crypto.randomUUID() +
        '.' +
        (file.type === 'image/png'
          ? 'png'
          : file.type === 'image/gif'
            ? 'gif'
            : 'jpg')
      await getStore('private-documents').set(key, bytes.buffer)
      return Response.json({ key }, { headers })
    }
    if (route === 'document' && req.method === 'GET') {
      const key = new URL(req.url).searchParams.get('key') || ''
      if (!key.startsWith(user.id + '/') && !isAdmin)
        return new Response('Forbidden', { status: 403 })
      const file = await getStore('private-documents').get(key, {
        type: 'arrayBuffer',
      })
      if (!file) return new Response('Not found', { status: 404 })
      return new Response(file as ArrayBuffer, {
        headers: {
          ...headers,
          'Content-Type': key.endsWith('.png')
            ? 'image/png'
            : key.endsWith('.gif')
              ? 'image/gif'
              : 'image/jpeg',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
    if (route === 'application' && req.method === 'POST') {
      const b = z
        .object({
          kind: z.enum([
            'kyc',
            'cards',
            'loan',
            'link-card',
            'deposit',
            'invest',
          ]),
          data: z.record(
            z.string(),
            z.union([z.string().max(2000), z.number(), z.boolean()]),
          ),
        })
        .parse(await req.json())
      const allowed: Record<string, string[]> = {
        kyc: [
          'documentType',
          'front',
          'back',
          'dateOfBirth',
          'address',
          'occupation',
          'income',
          'consent',
          'accuracy',
        ],
        cards: [
          'firstName',
          'lastName',
          'email',
          'phone',
          'address',
          'country',
          'city',
          'postcode',
          'cardType',
          'consent',
          'accuracy',
        ],
        loan: [
          'amount',
          'salary',
          'payday',
          'facility',
          'tenure',
          'purpose',
          'consent',
        ],
        'link-card': ['testToken', 'cardType', 'consent'],
        deposit: ['amount', 'currency', 'network', 'reference', 'consent'],
        invest: ['plan', 'amount', 'consent'],
      }
      if (Object.keys(b.data).some((k) => !allowed[b.kind].includes(k)))
        return Response.json(
          { error: 'Unsupported application fields.' },
          { status: 400, headers },
        )
      if (b.data.consent !== true)
        return Response.json(
          { error: 'Please confirm that this is a simulated application.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'loan' &&
        (!b.data.purpose ||
          ![
            'Personal loan',
            'Business loan',
            'Education loan',
            'Mortgage preview',
          ].includes(String(b.data.facility)) ||
          !['6 months', '12 months', '24 months', '36 months'].includes(
            String(b.data.tenure),
          ))
      )
        return Response.json(
          { error: 'Complete the loan purpose, facility, and tenure.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'loan' &&
        (!Number.isFinite(Number(b.data.amount)) ||
          Number(b.data.amount) < 5000 ||
          Number(b.data.amount) > 1000000 ||
          !Number.isFinite(Number(b.data.salary)) ||
          Number(b.data.salary) <= 0 ||
          !Number.isInteger(Number(b.data.payday)) ||
          Number(b.data.payday) < 1 ||
          Number(b.data.payday) > 31)
      )
        return Response.json(
          { error: 'Enter a valid loan amount, salary and payday.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'kyc' &&
        (!b.data.front ||
          !b.data.back ||
          ![b.data.front, b.data.back].every((k) =>
            String(k).startsWith(user.id + '/'),
          ) ||
          b.data.accuracy !== true)
      )
        return Response.json(
          { error: 'Upload both sample document images and confirm accuracy.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'cards' &&
        !['Visa', 'MasterCard', 'Discover'].includes(String(b.data.cardType))
      )
        return Response.json(
          { error: 'Choose a supported demo card network.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'kyc' &&
        !['Passport', 'National ID', 'Driving License'].includes(
          String(b.data.documentType),
        )
      )
        return Response.json(
          { error: 'Choose a document type.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'invest' &&
        !['Steady Roots', 'New Horizons', 'Long View'].includes(
          String(b.data.plan),
        )
      )
        return Response.json(
          { error: 'Choose a sample investment plan.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'cards' &&
        (!b.data.firstName ||
          !b.data.lastName ||
          !b.data.address ||
          b.data.accuracy !== true)
      )
        return Response.json(
          { error: 'Complete the applicant details and confirmations.' },
          { status: 400, headers },
        )
      if (b.kind === 'link-card' && b.data.testToken !== 'tok_demo_visa')
        return Response.json(
          { error: 'Use the provided demo token only.' },
          { status: 400, headers },
        )
      if (
        b.kind === 'deposit' &&
        (!Number.isFinite(Number(b.data.amount)) ||
          Number(b.data.amount) < 0.01 ||
          Number(b.data.amount) > 1000000)
      )
        return Response.json(
          { error: 'Enter a positive simulated deposit amount.' },
          { status: 400, headers },
        )
      if (b.kind === 'invest') {
        const cents = Math.round(Number(b.data.amount) * 100)
        if (!Number.isSafeInteger(cents) || cents < 10000 || cents > 100000000)
          return Response.json(
            { error: 'Enter a sample investment between $100 and $1,000,000.' },
            { status: 400, headers },
          )
        await db.transaction(async (tx) => {
          const rows = await tx
            .update(profiles)
            .set({ balance: sql`${profiles.balance}-${cents}` })
            .where(
              and(
                eq(profiles.id, user.id),
                sql`${profiles.balance} >= ${cents}`,
              ),
            )
            .returning()
          if (!rows.length) throw new Error('Insufficient simulated balance.')
          await tx.insert(ledger).values({
            userId: user.id,
            amount: -cents,
            description: 'Sample investment: ' + String(b.data.plan),
          })
          await tx.insert(applications).values({
            userId: user.id,
            kind: b.kind,
            data: b.data,
            status: 'active',
          })
        })
      } else
        await db
          .insert(applications)
          .values({ userId: user.id, kind: b.kind, data: b.data })
      return Response.json(
        { message: 'Your simulated request was saved.' },
        { headers },
      )
    }
    if (route === 'transfer' && req.method === 'POST') {
      const b = z
        .object({
          amount: z.coerce.number().positive().max(1000000),
          method: z.enum([
            'PayPal',
            'CashApp',
            'GCash',
            'USA Bank',
            'Local Bank',
            'Crypto',
          ]),
          recipient: z.string().min(3).max(200),
          description: z.string().max(300).optional(),
          consent: z.literal(true),
        })
        .parse(await req.json())
      const cents = Math.round(b.amount * 100)
      if (cents < 1) throw new Error('Enter an amount of at least $0.01.')
      await db.transaction(async (tx) => {
        const rows = await tx
          .update(profiles)
          .set({ balance: sql`${profiles.balance}-${cents}` })
          .where(
            and(eq(profiles.id, user.id), sql`${profiles.balance} >= ${cents}`),
          )
          .returning()
        if (!rows.length) throw new Error('Insufficient simulated balance.')
        await tx.insert(ledger).values({
          userId: user.id,
          amount: -cents,
          description: `Demo ${b.method} transfer · ${b.recipient}`,
        })
      })
      return Response.json(
        { message: 'Simulated transfer completed. No money was sent.' },
        { headers },
      )
    }
    if (route === 'admin-data' && req.method === 'GET')
      return Response.json(
        {
          profiles: await db
            .select()
            .from(profiles)
            .orderBy(desc(profiles.createdAt)),
          applications: await db
            .select()
            .from(applications)
            .orderBy(desc(applications.createdAt)),
          wallets: await db.select().from(wallets),
          inquiries: await db
            .select()
            .from(inquiries)
            .orderBy(desc(inquiries.createdAt))
            .limit(100),
        },
        { headers },
      )
    if (route === 'admin-review' && req.method === 'POST') {
      const b = z
        .object({
          id: z.uuid(),
          status: z.enum(['approved', 'rejected']),
          notes: z.string().max(2000),
        })
        .parse(await req.json())
      await db.transaction(async (tx) => {
        const [app] = await tx
          .update(applications)
          .set({ status: b.status, notes: b.notes })
          .where(
            and(eq(applications.id, b.id), eq(applications.status, 'pending')),
          )
          .returning()
        if (!app) throw new Error('This application has already been reviewed.')
        if (b.status === 'approved' && ['loan', 'deposit'].includes(app.kind))
          throw new Error('Financial approvals are disabled.')
        if (b.status === 'approved' && ['loan', 'deposit'].includes(app.kind)) {
          const cents = Math.round(Number(app.data.amount) * 100)
          if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100000000)
            throw new Error('Invalid amount.')
          await tx
            .update(profiles)
            .set({ balance: sql`${profiles.balance}+${cents}` })
            .where(eq(profiles.id, app.userId))
          await tx.insert(ledger).values({
            userId: app.userId,
            amount: cents,
            description: 'Simulated ' + app.kind + ' approval',
          })
        }
        if (app.kind === 'kyc' && b.status === 'approved')
          await tx
            .update(profiles)
            .set({ data: sql`${profiles.data} || '{"accountLevel":2}'::jsonb` })
            .where(eq(profiles.id, app.userId))
        await tx
          .insert(audits)
          .values({ actor: user.id, action: b.status, target: b.id })
      })
      return Response.json(
        { message: 'Review saved to the simulated ledger and audit record.' },
        { headers },
      )
    }
    if (route === 'admin-wallet' && req.method === 'POST') {
      const b = z
        .object({
          symbol: z.enum(['BTC', 'ETH', 'USDT']),
          address: z.string().startsWith('DEMO_').max(200),
          network: z.string().min(1).max(80),
        })
        .parse(await req.json())
      await db.transaction(async (tx) => {
        await tx
          .insert(wallets)
          .values(b)
          .onConflictDoUpdate({ target: wallets.symbol, set: b })
        await tx.insert(audits).values({
          actor: user.id,
          action: 'update demo wallet',
          target: b.symbol,
        })
      })
      return Response.json(
        { message: 'Demo wallet settings saved.' },
        { headers },
      )
    }
    return Response.json({ error: 'Not found' }, { status: 404, headers })
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof z.ZodError
            ? 'Please check the form fields.'
            : e instanceof Error &&
                [
                  'Insufficient simulated balance.',
                  'This application has already been reviewed.',
                  'Invalid amount.',
                  'Enter an amount of at least $0.01.',
                  'Financial approvals are disabled.',
                ].includes(e.message)
              ? e.message
              : 'The request could not be completed. Please try again.',
      },
      { status: 400, headers },
    )
  }
}
export const config = { path: '/api/banking/*' }

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Ticket } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, PageHeader, SearchInput, TableSkeleton } from '../components/ui'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toasts'
import { actions, fetchMembers } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { displayName, n } from '../lib/format'

export default function PromoCodes() {
  const toast = useToast()
  const { refresh } = useLiveData()
  const members = useQuery(() => fetchMembers(), [])
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState('')
  const [toggle, setToggle] = useState(null)

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (members.data || [])
      .filter((m) => !term || m.full_name.toLowerCase().includes(term) || m.promo_code.toLowerCase().includes(term) || m.committee_role.toLowerCase().includes(term))
      .sort((a, b) => a.member_no - b.member_no)
  }, [members.data, q])

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      toast('Could not copy. Select the code and copy it manually.', 'bad')
    }
  }

  return (
    <>
      <PageHeader title="Promo Codes" description="One unique code per AJK member. A valid code gives the customer the promo price and credits the sale to that member." />
      <div className="mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Name, code or bureau" label="Search promo codes" />
      </div>
      {members.error && !members.data && <ErrorState error={members.error} />}
      <Card bodyClass="p-0">
        {members.loading && !members.data ? (
          <TableSkeleton rows={10} cols={5} />
        ) : !rows.length ? (
          <EmptyState icon={Ticket} title="No codes match your search" />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-canvas/60">
                <tr>
                  <th className="th">No.</th>
                  <th className="th">Code</th>
                  <th className="th">AJK member</th>
                  <th className="th">Jawatan / Biro</th>
                  <th className="th text-right">Orders</th>
                  <th className="th text-right">Verified bottles</th>
                  <th className="th">Status</th>
                  <th className="th">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((m) => (
                  <tr key={m.member_id}>
                    <td className="td text-ink-3 tabular-nums">{m.member_no}</td>
                    <td className="td">
                      <button type="button" onClick={() => copy(m.promo_code)} className="inline-flex items-center gap-2 rounded-md bg-canvas px-2 py-1 font-mono text-sm font-medium ring-1 ring-line hover:ring-line-strong" aria-label={`Copy code ${m.promo_code}`}>
                        {m.promo_code}
                        {copied === m.promo_code ? <Check size={13} className="text-good" /> : <Copy size={13} className="text-ink-3" />}
                      </button>
                    </td>
                    <td className="td">
                      <Link to={`/members/${m.member_id}`} className="font-medium hover:underline">
                        {displayName(m.full_name)}
                      </Link>
                    </td>
                    <td className="td text-ink-2">{m.committee_role}</td>
                    <td className="td text-right tabular-nums">{n(m.total_orders)}</td>
                    <td className="td text-right tabular-nums">{n(m.verified_bottles)}</td>
                    <td className="td">{m.is_active ? <Badge tone="good">Active</Badge> : <Badge>Inactive</Badge>}</td>
                    <td className="td text-right">
                      <button type="button" className="btn btn-ghost h-8 px-2 text-xs" onClick={() => setToggle(m)}>
                        {m.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ConfirmDialog
        open={!!toggle}
        title={toggle?.is_active ? `Deactivate ${toggle?.promo_code}?` : `Activate ${toggle?.promo_code}?`}
        body={
          toggle?.is_active
            ? 'New customers will no longer get the promo price with this code. Existing orders and their attribution stay unchanged.'
            : 'Customers will be able to use this code again.'
        }
        confirmLabel={toggle?.is_active ? 'Deactivate' : 'Activate'}
        tone={toggle?.is_active ? 'danger' : 'primary'}
        onConfirm={async () => {
          await actions.setMemberActive(toggle.member_id, !toggle.is_active)
          toast(`Code ${toggle.promo_code} ${toggle.is_active ? 'deactivated' : 'activated'}.`)
          refresh()
        }}
        onClose={() => setToggle(null)}
      />
    </>
  )
}

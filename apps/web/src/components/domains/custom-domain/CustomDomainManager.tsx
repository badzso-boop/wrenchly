'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Plus, ChevronDown, ChevronUp, Rocket, Store, BookMarked } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomLogBuilder } from './CustomLogBuilder'
import { ChartBuilder } from './ChartBuilder'
import type { FieldType } from '@prisma/client'
import type { FieldWithConfig } from '@/server/domains/custom-domain/custom-domain.repository'
import type { TabKey } from '@/server/domains/custom-domain/custom-domain.service'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'TIME', label: 'Time' },
  { value: 'BOOLEAN', label: 'Yes / No' },
  { value: 'ENUM', label: 'Choice list' },
  { value: 'URL', label: 'Link' },
]

function AddFieldForm({ customDomainId, onAdded }: { customDomainId: string; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState<FieldType>('TEXT')
  const [unit, setUnit] = useState('')
  const [required, setRequired] = useState(false)
  const [optionsText, setOptionsText] = useState('')

  const addField = api.customDomain.addField.useMutation({
    onSuccess: () => {
      toast.success('Field added')
      setName(''); setUnit(''); setOptionsText(''); setRequired(false)
      onAdded()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addField.mutate({
      customDomainId,
      name,
      fieldType,
      unit: unit || undefined,
      required,
      options: fieldType === 'ENUM' ? optionsText.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`field-name-${customDomainId}`}>Field name</Label>
          <Input
            id={`field-name-${customDomainId}`}
            value={name}
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
            placeholder="e.g. Warranty expires"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={fieldType} onValueChange={(v) => { if (v !== null) setFieldType(v as FieldType) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {fieldType === 'ENUM' && (
        <div className="space-y-1.5">
          <Label>Options (comma-separated)</Label>
          <Input
            value={optionsText}
            onChange={(e) => setOptionsText((e.target as HTMLInputElement).value)}
            placeholder="e.g. small, medium, large"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-1.5 flex-1 mr-4">
          <Label>Unit (optional)</Label>
          <Input value={unit} onChange={(e) => setUnit((e.target as HTMLInputElement).value)} placeholder="e.g. kg" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Label className="text-sm">Required</Label>
          <Switch checked={required} onCheckedChange={setRequired} />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={addField.isPending || !name}>
        {addField.isPending ? 'Adding…' : 'Add field'}
      </Button>
    </form>
  )
}

interface DomainForRow {
  id: string
  name: string
  icon: string | null
  fields: FieldWithConfig[]
  isPublished: boolean
  publishedAt: Date | null
  maintenanceLogEnabled: boolean
  reminderEnabled: boolean
  tabOrder: string[]
}

const TAB_LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  reminders: 'Reminders',
  log: 'Log',
  statistics: 'Statistics',
  profile: 'Profile',
  collaborators: 'Collaborators',
}
const DEFAULT_TAB_ORDER: TabKey[] = ['maintenance', 'reminders', 'log', 'statistics', 'profile', 'collaborators']

function DomainRow({ domain, onChanged }: { domain: DomainForRow; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddField, setShowAddField] = useState(false)

  const removeField = api.customDomain.removeField.useMutation({
    onSuccess: () => { toast.success('Field removed'); onChanged() },
    onError: (err) => toast.error(err.message),
  })
  const deleteDomain = api.customDomain.delete.useMutation({
    onSuccess: () => { toast.success('Domain deleted'); onChanged() },
    onError: (err) => toast.error(err.message),
  })
  const publish = api.customDomainLog.publish.useMutation({
    onSuccess: () => { toast.success('Domain published to the store'); onChanged() },
    onError: (err) => toast.error(err.message),
  })
  const setMaintenanceLogEnabled = api.customDomain.setMaintenanceLogEnabled.useMutation({
    onSuccess: () => onChanged(),
    onError: (err) => toast.error(err.message),
  })
  const setReminderEnabled = api.customDomain.setReminderEnabled.useMutation({
    onSuccess: () => onChanged(),
    onError: (err) => toast.error(err.message),
  })
  const setTabOrder = api.customDomain.setTabOrder.useMutation({
    onSuccess: () => onChanged(),
    onError: (err) => toast.error(err.message),
  })
  const tabOrder: TabKey[] = domain.tabOrder.length > 0 ? (domain.tabOrder as TabKey[]) : DEFAULT_TAB_ORDER
  function moveTab(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= tabOrder.length) return
    const next = [...tabOrder]
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    setTabOrder.mutate({ id: domain.id, tabOrder: next })
  }

  const loggableFieldCount = domain.fields.filter((f) => f.loggable && !f.archivedAt).length
  const isPublished = domain.isPublished

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between p-3">
        <button
          type="button"
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="font-medium text-sm">{domain.icon ? `${domain.icon} ` : ''}{domain.name}</span>
          <span className="text-xs text-muted-foreground">({domain.fields.length} fields)</span>
          {isPublished && (
            <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">Published</span>
          )}
        </button>
        <div className="flex items-center gap-1">
          {!isPublished && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={publish.isPending || loggableFieldCount === 0}
              title={loggableFieldCount === 0 ? 'Add at least one log field before publishing' : 'Publish to the store'}
              onClick={() => {
                if (window.confirm(`Publish "${domain.name}" to the store? Its field structure will be locked afterward.`)) {
                  publish.mutate({ customDomainId: domain.id })
                }
              }}
            >
              <Rocket className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { if (window.confirm(`Delete "${domain.name}"?`)) deleteDomain.mutate({ id: domain.id }) }}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-4">
          {isPublished && (
            <p className="text-xs text-muted-foreground">
              Published{domain.publishedAt ? ` on ${new Date(domain.publishedAt).toLocaleDateString()}` : ''} — field
              structure is locked. Edit sample data from{' '}
              <Link href="/custom-domains/published" className="underline">My published domains</Link>.
            </p>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={`maintenance-log-${domain.id}`} className="text-sm font-medium">Maintenance Log</Label>
              <p className="text-xs text-muted-foreground">Show a Maintenance Log tab on items in this domain.</p>
            </div>
            <Switch
              id={`maintenance-log-${domain.id}`}
              checked={domain.maintenanceLogEnabled}
              onCheckedChange={(checked) => setMaintenanceLogEnabled.mutate({ id: domain.id, enabled: checked })}
              disabled={setMaintenanceLogEnabled.isPending}
            />
          </div>

          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={`reminders-${domain.id}`} className="text-sm font-medium">Reminders</Label>
              <p className="text-xs text-muted-foreground">Show a Reminders tab on items in this domain.</p>
            </div>
            <Switch
              id={`reminders-${domain.id}`}
              checked={domain.reminderEnabled}
              onCheckedChange={(checked) => setReminderEnabled.mutate({ id: domain.id, enabled: checked })}
              disabled={setReminderEnabled.isPending}
            />
          </div>

          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Tab order</p>
            <p className="text-xs text-muted-foreground">Controls the order tabs appear in on items in this domain.</p>
            {tabOrder.map((key, index) => (
              <div key={key} className="flex items-center justify-between text-sm py-1">
                <span>{TAB_LABELS[key] ?? key}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0 || setTabOrder.isPending}
                    onClick={() => moveTab(index, -1)}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === tabOrder.length - 1 || setTabOrder.isPending}
                    onClick={() => moveTab(index, 1)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Profile fields</p>
            {domain.fields.filter((f) => !f.loggable).map((field) => (
              <div key={field.id} className="flex items-center justify-between text-sm py-1">
                <span>{field.name}{field.unit ? ` (${field.unit})` : ''}{field.required ? ' *' : ''}</span>
                {!isPublished && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeField.mutate({ fieldId: field.id })}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}

            {!isPublished && (
              showAddField ? (
                <AddFieldForm customDomainId={domain.id} onAdded={() => { setShowAddField(false); onChanged() }} />
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowAddField(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add field
                </Button>
              )
            )}
          </div>

          <Separator />
          <CustomLogBuilder domain={domain} onChanged={onChanged} isPublished={isPublished} />

          <Separator />
          <ChartBuilder customDomainId={domain.id} fields={domain.fields} />
        </div>
      )}
    </div>
  )
}

export function CustomDomainManager() {
  const domains = api.customDomain.listMine.useQuery()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const create = api.customDomain.create.useMutation({
    onSuccess: () => {
      toast.success('Custom domain created')
      setName(''); setIcon(''); setShowCreate(false)
      domains.refetch()
    },
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Custom Domains</CardTitle>
        <CardDescription>Define your own item types with custom fields</CardDescription>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" render={<Link href="/custom-domains/store" />}>
            <Store className="h-3.5 w-3.5 mr-1" /> Store
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/custom-domains/published" />}>
            <BookMarked className="h-3.5 w-3.5 mr-1" /> My published domains
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {domains.isLoading && <Skeleton className="h-16 w-full" />}

        {domains.data?.map((domain) => (
          <DomainRow key={domain.id} domain={domain} onChanged={() => domains.refetch()} />
        ))}

        {domains.data?.length === 0 && !showCreate && (
          <p className="text-sm text-muted-foreground">No custom domains yet.</p>
        )}

        {showCreate ? (
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate({ name, icon: icon || undefined }) }}
            className="space-y-3 rounded-lg border p-3"
          >
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="domain-name">Name</Label>
                <Input id="domain-name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="e.g. Coin Collection" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="domain-icon">Icon (emoji)</Label>
                <Input id="domain-icon" value={icon} onChange={(e) => setIcon((e.target as HTMLInputElement).value)} placeholder="🪙" className="w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={create.isPending || !name}>
                {create.isPending ? 'Creating…' : 'Create'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New custom domain
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

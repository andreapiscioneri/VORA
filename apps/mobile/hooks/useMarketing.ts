import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { MarketingCampaign } from '@vora/shared/types/campaign'
import type { EmailTemplate } from '@vora/shared/types/emailTemplate'
import type { Segment } from '@vora/shared/types/segment'
import type { Automation } from '@vora/shared/types/automation'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

// Backs the single Marketing screen's four tabs (Campaigns/Templates/
// Segments/Automations) — one screen with a segmented control instead of
// four separate routes, since these are low-frequency admin resources on
// mobile rather than a daily workflow surface. Each tab paginates
// independently since they're four unrelated server-side cursors.
export function useMarketing() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [campaignsCursor, setCampaignsCursor] = useState<string | null>(null)
  const [campaignsHasMore, setCampaignsHasMore] = useState(false)
  const [templatesCursor, setTemplatesCursor] = useState<string | null>(null)
  const [templatesHasMore, setTemplatesHasMore] = useState(false)
  const [segmentsCursor, setSegmentsCursor] = useState<string | null>(null)
  const [segmentsHasMore, setSegmentsHasMore] = useState(false)
  const [automationsCursor, setAutomationsCursor] = useState<string | null>(null)
  const [automationsHasMore, setAutomationsHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [c, t, s, a] = await Promise.all([
        api.get<PageResult<MarketingCampaign>>('/campaigns'),
        api.get<PageResult<EmailTemplate>>('/email-templates'),
        api.get<PageResult<Segment>>('/segments'),
        api.get<PageResult<Automation>>('/automations'),
      ])
      setCampaigns(c.items)
      setCampaignsCursor(c.nextCursor)
      setCampaignsHasMore(c.hasMore)
      setTemplates(t.items)
      setTemplatesCursor(t.nextCursor)
      setTemplatesHasMore(t.hasMore)
      setSegments(s.items)
      setSegmentsCursor(s.nextCursor)
      setSegmentsHasMore(s.hasMore)
      setAutomations(a.items)
      setAutomationsCursor(a.nextCursor)
      setAutomationsHasMore(a.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load marketing data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadMoreCampaigns = useCallback(async () => {
    if (!campaignsHasMore || loadingMore || !campaignsCursor) return
    setLoadingMore(true)
    try {
      const page = await api.get<PageResult<MarketingCampaign>>(`/campaigns?cursor=${encodeURIComponent(campaignsCursor)}`)
      setCampaigns((prev) => [...prev, ...page.items])
      setCampaignsCursor(page.nextCursor)
      setCampaignsHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [campaignsHasMore, loadingMore, campaignsCursor])

  const loadMoreTemplates = useCallback(async () => {
    if (!templatesHasMore || loadingMore || !templatesCursor) return
    setLoadingMore(true)
    try {
      const page = await api.get<PageResult<EmailTemplate>>(`/email-templates?cursor=${encodeURIComponent(templatesCursor)}`)
      setTemplates((prev) => [...prev, ...page.items])
      setTemplatesCursor(page.nextCursor)
      setTemplatesHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [templatesHasMore, loadingMore, templatesCursor])

  const loadMoreSegments = useCallback(async () => {
    if (!segmentsHasMore || loadingMore || !segmentsCursor) return
    setLoadingMore(true)
    try {
      const page = await api.get<PageResult<Segment>>(`/segments?cursor=${encodeURIComponent(segmentsCursor)}`)
      setSegments((prev) => [...prev, ...page.items])
      setSegmentsCursor(page.nextCursor)
      setSegmentsHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [segmentsHasMore, loadingMore, segmentsCursor])

  const loadMoreAutomations = useCallback(async () => {
    if (!automationsHasMore || loadingMore || !automationsCursor) return
    setLoadingMore(true)
    try {
      const page = await api.get<PageResult<Automation>>(`/automations?cursor=${encodeURIComponent(automationsCursor)}`)
      setAutomations((prev) => [...prev, ...page.items])
      setAutomationsCursor(page.nextCursor)
      setAutomationsHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [automationsHasMore, loadingMore, automationsCursor])

  return {
    campaigns,
    templates,
    segments,
    automations,
    loading,
    loadingMore,
    error,
    reload: load,
    campaignsHasMore,
    templatesHasMore,
    segmentsHasMore,
    automationsHasMore,
    loadMoreCampaigns,
    loadMoreTemplates,
    loadMoreSegments,
    loadMoreAutomations,
  }
}

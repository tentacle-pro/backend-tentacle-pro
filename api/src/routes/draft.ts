import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { ApiResponse, DraftAddResponse } from '@tentacle-pro/core'
import { addDraft } from '@tentacle-pro/wechat'
import type { AppVariables } from '../types'

const draftAddSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  digest: z.string().optional(),
  content: z.string().min(1),
  thumb_media_id: z.string().min(1),
  need_open_comment: z.literal(0).or(z.literal(1)).optional().default(1),
  only_fans_can_comment: z.literal(0).or(z.literal(1)).optional().default(0),
})

export const draftRouter = new Hono<{ Variables: AppVariables }>()

// POST /post2wechat/draft/add
draftRouter.post('/add', zValidator('json', draftAddSchema), async (c) => {
  const body = c.req.valid('json')
  const wechatAccountId = c.get('wechatAccountId')
  const requestId = c.get('requestId')

  const mediaId = await addDraft(wechatAccountId, body)

  const resp: ApiResponse<DraftAddResponse> = {
    ok: true,
    request_id: requestId,
    data: { media_id: mediaId },
  }
  return c.json(resp)
})

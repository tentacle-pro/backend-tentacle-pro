import { AppError, ErrorCode } from '@tentacle-pro/core'
import type { DraftAddRequest } from '@tentacle-pro/core'
import { getAccessToken, forceRefreshToken } from './token-manager'
import type { WxDraftAddResponse } from './types'
import { WX_ERRCODE } from './types'

const WX_DRAFT_ADD_URL = 'https://api.weixin.qq.com/cgi-bin/draft/add'

function isTokenError(errcode: number): boolean {
  return errcode === 40001 || errcode === 42001 || errcode === 40013
}

export async function addDraft(
  wechatAccountId: string,
  article: DraftAddRequest
): Promise<string> {
  let accessToken = await getAccessToken(wechatAccountId)

  const doRequest = async (token: string): Promise<WxDraftAddResponse> => {
    const url = `${WX_DRAFT_ADD_URL}?access_token=${token}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles: [article] }),
    })
    if (!resp.ok) {
      throw new AppError(
        ErrorCode.SYS_500_INTERNAL_ERROR,
        `WeChat draft/add HTTP error: ${resp.status}`,
        502
      )
    }
    return resp.json() as Promise<WxDraftAddResponse>
  }

  let result = await doRequest(accessToken)

  if (result.errcode && isTokenError(result.errcode)) {
    accessToken = await forceRefreshToken(wechatAccountId)
    result = await doRequest(accessToken)
  }

  if (result.errcode && result.errcode !== WX_ERRCODE.OK) {
    throw new AppError(
      ErrorCode.SYS_500_INTERNAL_ERROR,
      `WeChat draft/add error ${result.errcode}: ${result.errmsg}`,
      502
    )
  }

  return result.media_id
}

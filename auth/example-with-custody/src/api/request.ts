import { record } from './log'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * The single choke point. Every request in this app goes through here, which is
 * the only way the credential logic stays in one place — scattering `fetch`
 * across components is how refresh bugs are born.
 *
 * `carried` is purely for the on-screen log.
 */
export async function request<T>(
  url: string,
  init: RequestInit & { carried: string },
): Promise<T> {
  const { carried, ...options } = init
  const started = performance.now()

  let response: Response
  try {
    response = await fetch(url, options)
  } catch (error) {
    record({ method: options.method ?? 'GET', url, carried, status: 'network error', ms: Math.round(performance.now() - started) })
    throw error
  }

  record({
    method: options.method ?? 'GET',
    url,
    carried,
    status: response.status,
    ms: Math.round(performance.now() - started),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, body.error ?? response.statusText)
  return body as T
}

export const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

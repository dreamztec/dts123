import { useCallback, useEffect, useState } from 'react'

export type ApiState<T> = { data:T|null; loading:boolean; error:string|null; refetch:() => void }

export function useApi<T>(url:string|null): ApiState<T> {
  const [state,setState] = useState<ApiState<T>>({ data:null, loading:Boolean(url), error:null, refetch:() => {} })
  const [tick,setTick] = useState(0)
  const refetch = useCallback(() => setTick((value) => value + 1),[])
  useEffect(() => {
    if (!url) { setState({ data:null, loading:false, error:null, refetch }); return }
    let active = true
    setState((previous) => ({ ...previous, loading:true, error:null, refetch }))
    fetch(url,{ credentials:'same-origin' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!active) return
        if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Request failed')
        setState({ data:payload as T, loading:false, error:null, refetch })
      })
      .catch((error:unknown) => { if (active) setState({ data:null, loading:false, error:error instanceof Error ? error.message : 'Request failed', refetch }) })
    return () => { active = false }
  },[url,tick])
  return { ...state, refetch }
}
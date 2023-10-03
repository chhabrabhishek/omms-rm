import { UseQueryResult } from "@tanstack/react-query"
import LoadingBlock from "./LoadingBlock"

// TODO: Add onNotOk, onErr callbacks too.
export default function WithQuery<R, D extends { ok: boolean; result?: R }, E>(props: {
  query: UseQueryResult<D, E>
  onOk?: (result?: R) => JSX.Element | false
  onIdle?: () => JSX.Element
  onLoading?: () => JSX.Element
}) {
  if (props.query.isLoading) {
    return <>{props.onLoading?.() ?? <LoadingBlock />}</>
  }

  if (props.query.isSuccess && props.query.data) {
    if (props.query.data.ok) {
      return <>{props.onOk?.(props.query.data.result)}</>
    }
  }

  return <>{props.onIdle?.()}</>
}

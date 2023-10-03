import isPlainObject from "lodash.isplainobject"

// TODO: Use better type for the parameter.
export function fromObject(record: Record<string, unknown>) {
  const form = new FormData()

  for (const [key, value] of Object.entries(record)) {
    if (value) {
      if (isPlainObject(value)) {
        form.append(key, JSON.stringify(value))
      } else {
        // TODO: Use better type.
        form.append(key, value as never)
      }
    }
  }

  return form
}

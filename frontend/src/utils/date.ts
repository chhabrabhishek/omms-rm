import { DateTime } from "luxon"

export function fromDjangoISO(date: string) {
  return DateTime.fromISO(date.split(" ").join("T"))
}

export function toDateTimeString(date: DateTime) {
  return date.toLocaleString(DateTime.DATETIME_MED)
}

export function toDateString(date: DateTime) {
  return date.toLocaleString(DateTime.DATE_MED)
}

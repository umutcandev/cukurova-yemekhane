"use client"

import { tr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"

interface DatePickerProps {
  availableDates: Date[]
  dateRange: DateRange | undefined
  onSelect: (range: DateRange | undefined) => void
}

export function DatePicker({ availableDates, dateRange, onSelect }: DatePickerProps) {
  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && !range?.to) {
      onSelect({ from: range.from, to: range.from })
    } else {
      onSelect(range)
    }
  }

  return (
    <div className="flex justify-center">
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={handleSelect}
        disabled={(date) =>
          !availableDates.some((availableDate) => availableDate.toDateString() === date.toDateString())
        }
        locale={tr}
        className="rounded-md border"
      />
    </div>
  )
}

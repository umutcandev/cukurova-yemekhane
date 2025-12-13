"use client"
import { useState } from "react"
import { tr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"

interface DatePickerProps {
  availableDates: Date[]
  onDateRangeSelect: (range: DateRange | undefined) => void
  onCancel: () => void
}

export function DatePicker({ availableDates, onDateRangeSelect, onCancel }: DatePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  const handleSelect = (range: DateRange | undefined) => {
    // If user selects a single date (from is set but to is not), create a range with same from/to
    if (range?.from && !range?.to) {
      setDateRange({ from: range.from, to: range.from })
    } else {
      setDateRange(range)
    }
  }

  const handleShow = () => {
    onDateRangeSelect(dateRange)
  }

  const handleCancel = () => {
    setDateRange(undefined)
    onCancel()
  }

  return (
    <div className="space-y-6">
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

      <div className="flex gap-3 px-2">
        <Button variant="outline" onClick={handleCancel} className="flex-1 h-11 bg-transparent">
          İptal
        </Button>
        <Button onClick={handleShow} className="flex-1 h-11" disabled={!dateRange?.from}>
          Göster
        </Button>
      </div>
    </div>
  )
}

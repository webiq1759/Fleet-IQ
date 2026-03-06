import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onDatesChange: (start: string, end: string) => void;
  blockedDates?: string[];
  className?: string;
  style?: React.CSSProperties;
  singleSelection?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onDatesChange,
  blockedDates = [],
  className = '',
  style,
  singleSelection = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize view based on start date or today
  useEffect(() => {
    if (isOpen) {
      if (startDate) {
        // Create date from YYYY-MM-DD string treating it as local time
        const [y, m, d] = startDate.split('-').map(Number);
        setCurrentDate(new Date(y, m - 1, d));
      } else {
        setCurrentDate(new Date());
      }
    }
  }, [isOpen, startDate]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const isDateBlocked = (dateStr: string) => blockedDates.includes(dateStr);
  const isDatePast = (y: number, m: number, d: number) => {
    const checkDate = new Date(y, m, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDateStr(year, month, day);

    if (isDatePast(year, month, day) || isDateBlocked(dateStr)) return;

    if (singleSelection) {
      onDatesChange(dateStr, dateStr);
      onClose();
      return;
    }

    if (!startDate || (startDate && endDate)) {
      onDatesChange(dateStr, '');
    } else {
      // Selecting end date
      // Compare string directly works for ISO format
      if (dateStr < startDate) {
        onDatesChange(dateStr, '');
      } else {
        // Validate range
        let isValidRange = true;
        let curr = new Date(startDate);
        const end = new Date(dateStr);

        // Loop through days between start and end
        while (curr < end) {
          curr.setDate(curr.getDate() + 1);
          const checkStr = curr.toISOString().split('T')[0];
          if (isDateBlocked(checkStr) && checkStr !== dateStr) {
            isValidRange = false;
            break;
          }
        }

        if (isValidRange) {
          onDatesChange(startDate, dateStr);
          onClose();
        } else {
          // If range hits a blocked date, just set the clicked date as new start
          onDatesChange(dateStr, '');
        }
      }
    }
  };

  const renderDays = () => {
    const days = [];
    // Padding
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateStr(year, month, day);
      const isBlocked = isDateBlocked(dateStr);
      const isPast = isDatePast(year, month, day);
      const isDisabled = isBlocked || isPast;

      let isSelected = false;
      let isInRange = false;
      let isRangeStart = false;
      let isRangeEnd = false;

      if (startDate) {
        if (dateStr === startDate) {
          isSelected = true;
          isRangeStart = true;
        }

        if (!singleSelection && endDate) {
          if (dateStr === endDate) {
            isSelected = true;
            isRangeEnd = true;
          }
          if (dateStr > startDate && dateStr < endDate) {
            isInRange = true;
          }
        } else if (singleSelection && dateStr === startDate) {
          isRangeStart = true;
          isRangeEnd = true;
        }
      }

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`
            h-9 w-full text-sm flex items-center justify-center relative rounded-full transition-colors
            ${isDisabled
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed decoration-slate-300 line-through'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium'}
            ${isRangeStart ? '!bg-slate-900 !text-white dark:!bg-white dark:!text-slate-900 hover:!bg-slate-800' : ''}
            ${isRangeEnd ? '!bg-slate-900 !text-white dark:!bg-white dark:!text-slate-900 hover:!bg-slate-800' : ''}
            ${isInRange ? '!bg-slate-100 dark:!bg-slate-800 !rounded-none first:rounded-l-full last:rounded-r-full' : ''}
            ${isInRange && !isRangeStart && !isRangeEnd ? '' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div
      ref={containerRef}
      style={style}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-20 right-0 z-50 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 animate-in fade-in zoom-in-95 duration-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-slate-900 dark:text-white">{monthNames[month]} {year}</span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <button
          type="button"
          onClick={() => onDatesChange('', '')}
          className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          Clear
        </button>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-900 dark:text-white underline px-2 py-1">
          Close
        </button>
      </div>
    </div>
  );
};
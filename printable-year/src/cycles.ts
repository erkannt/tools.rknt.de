const appContainer = document.querySelector('#appContainer');
if (!appContainer) {
  throw new Error('ERROR: no appContainer found');
}

const isInputElement = (element: Element): element is HTMLInputElement => element instanceof HTMLInputElement;

const yearInput = document.querySelector('#yearInput');
if (!yearInput) {
  throw new Error('ERROR: no yearInput found');
}
if (!isInputElement(yearInput)) {
  throw new Error('ERROR: yearInput not an input');
}

const shadeWeekendsInput = document.querySelector('#shadeWeekends');
if (!shadeWeekendsInput) {
  throw new Error('ERROR: no shadeWeekendInput found');
}
if (!isInputElement(shadeWeekendsInput)) {
  throw new Error('ERROR: shadeWeekendsInput not an input');
}

const boldMonthsInput = document.querySelector('#boldMonths');
if (!boldMonthsInput) {
  throw new Error('ERROR: no boldMonthsInput found');
}
if (!isInputElement(boldMonthsInput)) {
  throw new Error('ERROR: boldMonthsInput not an input');
}

const datesInQuarter = (year: number, quarter: number): Date[] => {
  const weekOffset = quarter * 13;
  const daysOffset = weekOffset * 7;
  const firstMondayOfQuarter = new Date(year, 0, daysOffset - offsetOfFirstMondayFromNewYears(year));
  const dates = [];
  for (let i = 0; i <= 13 * 7 - 1; i++) {
    const date = new Date(firstMondayOfQuarter);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const offsetOfFirstMondayFromNewYears = (year: number): number => {
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfYear.getDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return offset - 1;
};

const weekdaysHeader = () => {
  const weekdayFormatter = new Intl.DateTimeFormat('default', { weekday: 'short' });

  const days = [];
  for (let i = 0; i <= 6; i++) {
    const date = new Date(1974, 0, i); // Use a fixed year to ensure the correct weekday
    const dayName = document.createElement('div');
    dayName.textContent = weekdayFormatter.format(date);
    dayName.classList.add('day-name');
    days.push(dayName);
  }
  return days;
};

const dayEntry = (date: Date) => {
  if (date.getDate() == 1) {
    return firstDayOfMonthEntry(date);
  }
  const dayFormatter = new Intl.DateTimeFormat('default', { day: '2-digit' });

  const dayNumber = document.createElement('div');
  dayNumber.textContent = dayFormatter.format(date);
  dayNumber.classList.add('day-number');
  dayNumber.classList.add('day', 'calendarItem');
  dayNumber.setAttribute('data-month', (date.getMonth() + 1).toString());
  dayNumber.setAttribute('data-dayofweek', date.getDay().toString());
  dayNumber.setAttribute('data-day', date.getDate().toString());

  return dayNumber;
};

const firstDayOfMonthEntry = (date: Date) => {
  const monthFormatter = new Intl.DateTimeFormat('default', { month: 'short' });

  const firstOfMonth = document.createElement('div');
  firstOfMonth.textContent = monthFormatter.format(date);
  firstOfMonth.classList.add('firstOfMonth', 'day', 'calendarItem');
  firstOfMonth.setAttribute('data-month', (date.getMonth() + 1).toString());
  firstOfMonth.setAttribute('data-dayofweek', date.getDay().toString());
  firstOfMonth.setAttribute('data-day', date.getDate().toString());

  return firstOfMonth;
};

const refreshCalendar = (year: number) => {
  appContainer.innerHTML = '';
  const calendarContainer = document.createElement('div');
  calendarContainer.id = 'calendarContainer';
  calendarContainer.setAttribute('data-shadeWeekends', String(shadeWeekendsInput.checked));
  calendarContainer.setAttribute('data-boldMonths', String(boldMonthsInput.checked));
  appContainer.appendChild(calendarContainer);

  const quarterIndices = Array.from({ length: 4 }, (_, i) => i);
  quarterIndices.forEach((quarterIdx) => {
    const quarterContainer = document.createElement('div');
    quarterContainer.classList.add('quarterContainer');
    weekdaysHeader().forEach((day) => quarterContainer.appendChild(day));

    datesInQuarter(year, quarterIdx).forEach((date, index) => {
      const dayElement = dayEntry(date);
      dayElement.setAttribute('data-quarter', quarterIdx.toString());
      dayElement.setAttribute('data-cycle', (Math.floor(index / 7 / 4) + 1).toString());
      dayElement.setAttribute('data-cycleweek', ((Math.floor(index / 7) % 4) + 1).toString());
      quarterContainer.appendChild(dayElement);
    });

    calendarContainer.appendChild(quarterContainer);
  });
};

yearInput.addEventListener('change', () => {
  refreshCalendar(Number(yearInput.value));
});

shadeWeekendsInput.addEventListener('change', () => {
  refreshCalendar(Number(yearInput.value));
});

boldMonthsInput.addEventListener('change', () => {
  refreshCalendar(Number(yearInput.value));
});

yearInput.value = new Date().getFullYear().toString();

refreshCalendar(Number(yearInput.value));

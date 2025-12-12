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

const showWeeknumbersInput = document.querySelector('#showWeeknumbers');
if (!showWeeknumbersInput) {
  throw new Error('ERROR: no showWeeknumbersInput found');
}
if (!isInputElement(showWeeknumbersInput)) {
  throw new Error('ERROR: showWeeknumbersInput not an input');
}

const datesInQuarter = (year: number, quarter: number): Date[] => {
  const weekOffset = quarter * 13;
  const daysOffset = weekOffset * 7;
  const firstMondayOfQuarter = new Date(year, 0, daysOffset - offsetOfFirstMondayFromNewYears(year));
  const dates = [];
  for (let i = 0; i <= 13 * 7; i++) {
    const currentDate = new Date(firstMondayOfQuarter.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(currentDate);
  }
  return dates;
};

const quarterHeader = (year: number, quarterIdx: number) => {
  const quarter = document.createElement('span');
  quarter.textContent = `Quarter ${(quarterIdx + 1).toString()}`;
  quarter.classList.add('quarterHeader', 'calendarItem');
  quarter.setAttribute('data-quarter', (quarterIdx + 1).toString());
  return quarter;
};

const offsetOfFirstMondayFromNewYears = (year: number): number => {
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfYear.getDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return offset;
};

const getIsoWeek = (input: Date) => {
  const date = new Date(input.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

const weekdaysHeader = () => {
  const weekdayFormatter = new Intl.DateTimeFormat('default', { weekday: 'narrow' });

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
  const dayFormatter = new Intl.DateTimeFormat('default', { day: '2-digit' });

  const dayNumber = document.createElement('div');
  dayNumber.textContent = dayFormatter.format(date);
  dayNumber.classList.add('day-number');

  const weekNumber = document.createElement('div');
  weekNumber.classList.add('week-number');

  if (date.getDay() == 1 && showWeeknumbersInput.checked) {
    weekNumber.textContent = getIsoWeek(date).toString();
  }

  const entries = [dayNumber];
  entries.forEach((entry) => {
    entry.classList.add('day', 'calendarItem');
    entry.setAttribute('data-month', (date.getMonth() + 1).toString());
    entry.setAttribute('data-dayofweek', date.getDay().toString());
    entry.setAttribute('data-day', date.getDate().toString());
  });
  return entries;
};

const refreshCalendar = (year: number) => {
  appContainer.innerHTML = '';
  const calendarContainer = document.createElement('div');
  calendarContainer.id = 'calendarContainer';
  calendarContainer.setAttribute('data-shadeWeekends', String(shadeWeekendsInput.checked));
  appContainer.appendChild(calendarContainer);

  const quarterIndices = Array.from({ length: 4 }, (_, i) => i);
  quarterIndices.forEach((quarterIdx) => {
    //calendarContainer.appendChild(quarterHeader(year, quarterIdx));

    const quarterContainer = document.createElement('div');
    quarterContainer.classList.add('quarterContainer');
    weekdaysHeader().forEach((day) => quarterContainer.appendChild(day));

    datesInQuarter(year, quarterIdx).forEach((date) => {
      dayEntry(date).forEach((entry) => quarterContainer.appendChild(entry));
    });

    calendarContainer.append(quarterContainer);
  });
};

yearInput.addEventListener('change', () => {
  refreshCalendar(Number(yearInput.value));
});

shadeWeekendsInput.addEventListener('change', () => {
  refreshCalendar(Number(yearInput.value));
});

showWeeknumbersInput.addEventListener('change', () => {
  refreshCalendar(Number(yearInput.value));
});

yearInput.value = new Date().getFullYear().toString();

refreshCalendar(Number(yearInput.value));

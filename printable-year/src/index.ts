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

const datesInMonth = (year: number, month: number) => {
  const dates: Date[] = [];
  const currentDate = new Date(year, month, 1);
  while (currentDate.getFullYear() === year && currentDate.getMonth() === month) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const monthHeader = (year: number, monthIdx: number) => {
  const yearFormatter = new Intl.DateTimeFormat('default', { year: '2-digit' });
  const monthFormatter = new Intl.DateTimeFormat('default', { month: 'long' });
  const month = document.createElement('span');
  const date = new Date(year, monthIdx);
  let monthName = monthFormatter.format(date);
  if (monthIdx === 0) {
    monthName = `${monthName} '${yearFormatter.format(date)}`;
  }
  month.textContent = monthName;
  month.classList.add('month', 'calendarItem');
  month.setAttribute('data-month', (date.getMonth() + 1).toString());
  return month;
};

const dayEntry = (date: Date) => {
  const dayFormatter = new Intl.DateTimeFormat('default', { day: '2-digit' });
  const weekdayFormatter = new Intl.DateTimeFormat('default', { weekday: 'narrow' });

  const day = document.createElement('div');
  day.textContent = `${dayFormatter.format(date)} ${weekdayFormatter.format(date)}`;
  day.classList.add('day', 'calendarItem');
  day.setAttribute('data-month', (date.getMonth() + 1).toString());
  day.setAttribute('data-dayofweek', date.getDay().toString());
  day.setAttribute('data-day', date.getDate().toString());
  return day;
};

const refreshCalendar = (year: number) => {
  appContainer.innerHTML = '';
  const calendarContainer = document.createElement('div');
  calendarContainer.id = 'calendarContainer';
  appContainer.appendChild(calendarContainer);

  const monthsIndices = Array.from({ length: 12 }, (_, i) => i);
  monthsIndices.forEach((monthIdx) => {
    const monthContainer = document.createElement('div');
    monthContainer.classList.add('monthContainer');
    const month = monthHeader(year, monthIdx);
    monthContainer.appendChild(month);

    datesInMonth(year, monthIdx).forEach((date) => {
      const day = dayEntry(date);
      monthContainer.appendChild(day);
    });

    calendarContainer.append(monthContainer);
  });
};

yearInput.addEventListener('change', () => {
  refreshCalendar(Number(yearInput.value));
});

yearInput.value = new Date().getFullYear().toString();

refreshCalendar(Number(yearInput.value));

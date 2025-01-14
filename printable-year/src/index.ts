const appContainer = document.querySelector('#appContainer');
if (!appContainer) {
  throw new Error('ERROR: no appContainer found');
}

const datesInYear = () => {
  const dates: Array<Date> = [];
  let currentDate = new Date('2025');
  console.log(currentDate.getFullYear());
  while (currentDate.getFullYear() == 2025) {
    console.log(currentDate);
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const calendarContainer = document.createElement('div');
calendarContainer.id = 'calendarContainer';
appContainer.appendChild(calendarContainer);

const monthFormatter = new Intl.DateTimeFormat('default', { month: 'long' });

let monthName: string;
datesInYear().forEach((date) => {
  if (date.getDate() === 1) {
    const month = document.createElement('span');
    monthName = monthFormatter.format(date);
    month.textContent = monthName;
    month.classList.add('month', 'calendarItem');
    month.setAttribute('data-month', (date.getMonth() + 1).toString());
    calendarContainer.appendChild(month);
  }

  const day = document.createElement('div');
  day.textContent = date.toDateString();
  day.classList.add('day', 'calendarItem');
  day.setAttribute('data-month', (date.getMonth() + 1).toString());
  calendarContainer.appendChild(day);
});

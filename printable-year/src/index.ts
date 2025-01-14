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
appContainer.appendChild(calendarContainer);

const monthFormatter = new Intl.DateTimeFormat('default', { month: 'long' });

datesInYear().forEach((date) => {
  if (date.getDate() === 1) {
    const month = document.createElement('h2');
    month.textContent = monthFormatter.format(date);
    calendarContainer.appendChild(month);
  }

  const day = document.createElement('div');
  day.textContent = date.toDateString();
  calendarContainer.appendChild(day);
});

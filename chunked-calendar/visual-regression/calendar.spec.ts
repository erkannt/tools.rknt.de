import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests - Calendar App', () => {
  const testCases = [
    { year: 2026, boldMonths: false, quarterPerPage: false, name: '2026-normal-months-full-year' },
    { year: 2026, boldMonths: true, quarterPerPage: false, name: '2026-bold-months-full-year' },
    { year: 2026, boldMonths: false, quarterPerPage: true, name: '2026-normal-months-quarter-per-page' },
    { year: 2026, boldMonths: true, quarterPerPage: true, name: '2026-bold-months-quarter-per-page' },
    { year: 2027, boldMonths: false, quarterPerPage: false, name: '2027-normal-months-full-year' },
    { year: 2027, boldMonths: true, quarterPerPage: false, name: '2027-bold-months-full-year' },
    { year: 2027, boldMonths: false, quarterPerPage: true, name: '2027-normal-months-quarter-per-page' },
    { year: 2027, boldMonths: true, quarterPerPage: true, name: '2027-bold-months-quarter-per-page' },
  ]

  testCases.forEach(({ year, boldMonths, quarterPerPage, name }) => {
    test(`should render ${name.replace(/-/g, ' ')}`, async ({ page }) => {
      await page.goto('/')
      
      // Set the year input
      await page.fill('input[type="number"]', year.toString())
      
      // Set checkboxes based on state
      const boldMonthsCheckbox = page.locator('section label:has-text("Bold Months") input[type="checkbox"]')
      const quarterPerPageCheckbox = page.locator('section label:has-text("One Quarter per Page") input[type="checkbox"]')
      
      // Check/uncheck checkboxes based on desired state
      if (await boldMonthsCheckbox.isChecked() !== boldMonths) {
        await boldMonthsCheckbox.click()
      }
      
      if (await quarterPerPageCheckbox.isChecked() !== quarterPerPage) {
        await quarterPerPageCheckbox.click()
      }
      
      // Wait for calendar to update
      await page.waitForTimeout(1000)
      
      // Take screenshot of the main content area (exclude header/footer)
      const calendar = page.locator('main').locator('> :nth-child(3)')
      await expect(calendar).toHaveScreenshot(`${name}.png`)
    })
  })
})
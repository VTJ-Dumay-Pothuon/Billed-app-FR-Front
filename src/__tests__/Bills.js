/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      const iconActivated = windowIcon.classList.contains('active-icon')
      expect(iconActivated).toBeTruthy()

    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I am on Bills page", () => {
    describe("When I click on the eye icon", () => {
      test("Then it should open a modale", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const iconEye = screen.getAllByTestId('icon-eye')[0]
        const onNavigate = (pathname) => {document.body.innerHTML = ROUTES_PATH({ pathname })}
        const bill = new Bills({
            document,
            onNavigate,
            store: store,
            localStorage: localStorageMock
        })
        // define and trigger the click event
        $.fn.modal = jest.fn() // TODO: actually mock the modale
        const spy = jest.spyOn(bill, "handleClickIconEye")
        userEvent.click(iconEye);
        expect(spy).toHaveBeenCalled();
        // actually check if the modale is open
        const modale = screen.getByTestId('modaleFile')
        expect(modale).toBeVisible();
      })
    })
    /*
    describe("When I click on new bill button", () => {
      test("It should redirect to NewBill page", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const buttonNewBill = screen.getByTestId('btn-new-bill')
        const onNavigate = (pathname) => {document.body.innerHTML = ROUTES_PATH({ pathname })}
        const bill = new Bills({
            document,
            onNavigate,
            store: store,
            localStorage: localStorageMock
        })
        const spy = jest.spyOn(bill, "handleClickNewBill")
        userEvent.click(buttonNewBill)
        expect(spy).toHaveBeenCalled()
      })
    })
    */
    describe("When I click on new bill button", () => {
      test("It should redirect to NewBill page", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const buttonNewBill = screen.getByTestId('btn-new-bill')
        const onNavigate = (pathname) => {
          console.log('onNavigate called with pathname:', pathname)
          document.body.innerHTML = ROUTES({ pathname })
        }
        const bill = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage: localStorageMock
        })
        const spy = jest.spyOn(bill, "handleClickNewBill")
        userEvent.click(buttonNewBill)
        expect(spy).toHaveBeenCalled()
        expect(window.location.hash).toBe(ROUTES_PATH.NewBill)
      })
    })
  })
})

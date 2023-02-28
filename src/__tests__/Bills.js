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
import { formatStatus } from "../app/format.js";

describe("Given I am connected as an employee", () => {
  describe("When I navigate to Bills", () => {
    test("it should fetch bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Billed"))
      const contentPending  = await screen.getByText("Loading...")
      expect(contentPending).toBeTruthy()
      expect(screen.getByTestId("icon-window")).toBeTruthy()
    })

  })
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
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
      const dates = screen.queryAllByTestId('expense-date')
      const datesText = dates.map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...datesText].sort(antiChrono)
      expect(datesText).toEqual(datesSorted)
    })
  })

  describe("When I am on Bills page", () => {
    describe("When I click on the eye icon", () => {
      test("Then it should open a modale", () => {
        document.body.innerHTML = BillsUI({ data: [bills] })
        const iconEye = screen.getAllByTestId('icon-eye')[0]
        const onNavigate = (pathname) => {document.body.innerHTML = ROUTES_PATH({ pathname })}
        const myBills = new Bills({ document, onNavigate, store, localStorageMock })
        // define and trigger the click event
        $.fn.modal = jest.fn() // TODO: actually mock the modale
        const spy = jest.spyOn(myBills, "handleClickIconEye")
        userEvent.click(iconEye);
        expect(spy).toHaveBeenCalled();
        // actually check if the modale is open
        const modale = screen.getByTestId('modaleFile')
        expect(modale).toBeVisible();
      })
    })
    describe("When I click on new bill button", () => {
      test("It should redirect to NewBill page", () => {
        localStorageMock.setItem('user', JSON.stringify({ type: 'Employee' }))
        document.body.innerHTML = BillsUI({ data: [bills] })
        const buttonNewBill = screen.getByTestId('btn-new-bill')
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
        const myBills = new Bills({ document, onNavigate, store, localStorageMock })
        const handleClickNewBill = jest.fn(() => {
          myBills.handleClickNewBill
          window.history.pushState(null, null, ROUTES_PATH.NewBill)
        })
        buttonNewBill.addEventListener('click', handleClickNewBill)
        userEvent.click(buttonNewBill)
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(window.location.hash).toBe(ROUTES_PATH.NewBill)
      })
    })
  })
})


describe('integration tests for "Bills" class', () => {
  let bills;

  beforeEach(() => {
    const store = {
      bills: jest.fn(() => ({
        list: jest.fn(() => Promise.resolve([
          {
            id: 'bill-1',
            status: 'pending',
            date: new Date('2022-01-01')
          },
          {
            id: 'bill-2',
            status: 'accepted',
            date: new Date('2022-01-02')
          },
        ])),
      })),
    };
    document.createElement('div');
    bills = new Bills({ document, store });
  });

  describe('When I call "getBills" method', () => {
    test('it should return an array of bills with formatted date and status', async () => {
      const formattedBills = await bills.getBills();
      expect(formattedBills).toEqual([
        {
          id: 'bill-2',
          status: 'Accepté',
          date: '2 Jan. 22',
        },
        {
          id: 'bill-1',
          status: 'En attente',
          date: '1 Jan. 22',
        }
      ])
    })
    test('it should return an empty array when store contains no bills', async () => {
      const store = {
        bills: () => ({
          list: () => Promise.resolve([])
        })
      }
      const billList = new Bills({ document, store })
      const bills = await billList.getBills()
      expect(bills).toEqual([])
    })
    test("it should returns unformatted date and formatted status for corrupted data", async () => {
      const doc = { date: "invalid date", status: "pending" };
      const store = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([doc]),
        })
      };
      const component = new Bills({ document, store });
  
      const result = await component.getBills();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...doc,
        date: doc.date,
        status: formatStatus(doc.status)
      })
    })
  })
})
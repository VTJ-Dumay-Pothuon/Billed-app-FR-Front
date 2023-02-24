/**
 * @jest-environment jsdom
 */

import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import { fireEvent, screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import store from '../__mocks__/store.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes'

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the new bill form should be fully displayed", () => {
      document.body.innerHTML = NewBillUI()
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
      expect(screen.getByRole("button")).toBeTruthy()
    })

    describe("When I upload a new file", () => {
      test("Then it should return an object with fileUrl and key", async () => {
        document.body.innerHTML = NewBillUI()
        localStorage.setItem('user',JSON.stringify(store.user()))
        const onNavigate = (pathname) => {document.body.innerHTML = ROUTES_PATH({ pathname })}
        const newBill = new NewBill({document, onNavigate, store, localStorage})
        const formData = new FormData()
        const file = new File(['test'], 'test.png', { type: 'image/png' })
        formData.append('file', file)
        const email = JSON.parse(localStorage.getItem("user")).email
        formData.append('email', email)
  
        newBill.store.bills = jest.fn(() => ({
          create: jest.fn().mockResolvedValue({ fileUrl: 'https://test.com', key: '12345' })
        }));
  
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
  
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.png',
            files: [file]
          }
        }
        await handleChangeFile(event);
        expect(newBill.fileUrl).toEqual('https://test.com')
        expect(newBill.fileName).toEqual('test.png')
        expect(newBill.billId).toEqual('12345')
      })
    })

    describe('When I submit a form with correct input', () => {
      test('Then the form should be submitted and the new bill should be added', () => {
        document.body.innerHTML = NewBillUI()
        localStorage.setItem('user',JSON.stringify(store.user()))
        const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
        const newBill = new NewBill({document, onNavigate, store, localStorage})
        const handleSubmit = jest.fn(newBill.handleSubmit)

        const submitButton = screen.getByTestId('btn-send-bill')
        submitButton.addEventListener('submit', handleSubmit)

        userEvent.selectOptions(
          screen.getByTestId('expense-type'),
          'Services en ligne'
        )
        fireEvent.change(screen.getByTestId('datepicker'), {
          target: { value: '2022-02-01' },
        })
        userEvent.type(screen.getByTestId('expense-name'), 'Test')
        userEvent.type(screen.getByTestId('amount'), '100')
        userEvent.type(screen.getByTestId('vat'), '20')
        userEvent.type(screen.getByTestId('pct'), '20')
        userEvent.type(screen.getByTestId('commentary'), 'Juste un test')

        const file = new File(['hello'], 'hello.png', { type: 'image/png' })

        Object.defineProperty(screen.getByTestId('file'), 'files', {
          value: [file],
        })
        userEvent.click(submitButton)

        expect(handleSubmit).toHaveBeenCalled()
      })
      test("Then it should update the store with the new bill information and redirect to Bills page", () => {
        document.body.innerHTML = NewBillUI()
        localStorage.setItem('user',JSON.stringify(store.user()))
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
        const newBill = new NewBill({document, onNavigate, store, localStorage})
        newBill.store.bills = jest.fn(() => ({
          update: jest.fn().mockResolvedValue()
        }))
  
        const handleSubmit = jest.fn(newBill.handleSubmit)
  
        const event = {
          preventDefault: jest.fn(),
          target: {
            querySelector: jest.fn().mockReturnValueOnce({ value: null }) // target[0] is user email, not a form input
                                    .mockReturnValueOnce({ value: "Transports" })
                                    .mockReturnValueOnce({ value: "Test" })
                                    .mockReturnValueOnce({ value: "20" })
                                    .mockReturnValueOnce({ value: "2022-02-10" })
                                    .mockReturnValueOnce({ value: "2" })
                                    .mockReturnValueOnce({ value: "20" })
                                    .mockReturnValueOnce({ value: "Test" }),
          }
        }
  
        newBill.fileUrl = "https://test.com"
        newBill.fileName = "test.png"
        newBill.billId = "12345"
        const updateBillSpy = jest.spyOn(newBill, 'updateBill');
        const updateOnNavigateSpy = jest.spyOn(newBill, 'onNavigate');
        handleSubmit(event)
        
        expect(updateBillSpy).toHaveBeenCalled()
        expect(updateOnNavigateSpy).toHaveBeenCalledWith('#employee/bills')
      })
    })
  })
})

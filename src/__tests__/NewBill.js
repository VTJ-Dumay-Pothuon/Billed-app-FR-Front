/**
 * @jest-environment jsdom
 */

import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import { screen } from '@testing-library/dom'
import store from '../__mocks__/store.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes'
import sinon from 'sinon'

let mockEvent // set in beforeEach as a valid POST event

describe("Given I am connected as an employee", () => {

  beforeEach(() => {
    document.body.innerHTML = NewBillUI()
    localStorage.setItem('user',JSON.stringify(store.user()))

    mockEvent = {
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
  })

  describe("When I am on NewBill Page", () => {
    test("Then the new bill form should be fully displayed", () => {
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

    describe("When I create a new bill", () => {
      test("Then it should return a valid object with uploaded file informations", async () => {
        const onNavigate = (pathname) => {document.body.innerHTML = ROUTES_PATH({ pathname })}
        const newBill = new NewBill({document, onNavigate, store, localStorage})
        const formData = new FormData()
        const file = new File(['test'], 'test.png', { type: 'image/png' })
        formData.append('file', file)
        const email = JSON.parse(localStorage.getItem("user")).email
        formData.append('email', email)
  
        newBill.store.bills = jest.fn(() => ({
          create: jest.fn().mockResolvedValue({ fileUrl: 'https://test.com', key: '12345' })
        }))
  
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
  
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.png',
            files: [file]
          }
        }
        await handleChangeFile(event)
        expect(newBill.billId).toEqual('12345')
        expect(newBill.fileUrl).toEqual('https://test.com')
        expect(newBill.fileName).toEqual('test.png')
      })
      test ("Then it should return an error message if the file is not a png or jpg", async () => {
        const onNavigate = (pathname) => {document.body.innerHTML = ROUTES_PATH({ pathname })}
        const newBill = new NewBill({document, onNavigate, store, localStorage})
        const formData = new FormData()
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
        formData.append('file', file)
        const email = JSON.parse(localStorage.getItem("user")).email
        formData.append('email', email)
  
        newBill.store.bills = jest.fn(() => ({
          create: jest.fn().mockResolvedValue({ fileUrl: 'https://test.com', key: '12345' })
        }))
  
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        window.alert = jest.fn()
  
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.pdf',
            files: [file]
          }
        }
        const consoleSpy = sinon.spy(console, 'error')
        try {
          await handleChangeFile(event)
        } catch (error) {
          expect(error.message).toEqual("Le fichier doit être au format png ou jpeg")
          console.log(error.message)
          console.log(consoleSpy.args)
          expect(consoleSpy.calledWithMatch("Le fichier doit être au format png ou jpeg")).toBe(true)
        }
        expect(newBill.billId).toEqual('')
        expect(newBill.fileUrl).toEqual('')
        expect(newBill.fileName).toEqual('')
        consoleSpy.restore()
      })
    })

    // Integration test
    describe('When I send a POST request that contains a new bill to the API', () => {
      test("Then it should update the store with the new bill information and redirect to Bills page", () => {
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
        const newBill = new NewBill({document, onNavigate, store, localStorage})
        newBill.store.bills = jest.fn(() => ({
          update: jest.fn().mockResolvedValue()
        }))
  
        const handleSubmit = jest.fn(newBill.handleSubmit)
  
        newBill.fileUrl = "https://test.com"
        newBill.fileName = "test.png"
        newBill.billId = "12345"
        const updateBillSpy = jest.spyOn(newBill, 'updateBill')
        const updateOnNavigateSpy = jest.spyOn(newBill, 'onNavigate')
        handleSubmit(mockEvent)
        
        expect(updateBillSpy).toHaveBeenCalled()
        expect(updateOnNavigateSpy).toHaveBeenCalledWith('#employee/bills')
      })
      describe('When I send a POST request to the API and the router redirects to a wrong page', () => {
        test("Then it should display an Error 404 message", async () => {
          expect.assertions(2)
          const onNavigate = () => { 
            const error = new Error("Erreur 404")
            error.status = 404
            throw error 
          }
          const newBill = new NewBill({document, onNavigate, store, localStorage})
    
          const handleSubmit = jest.fn(newBill.handleSubmit)
          
          try {
            await handleSubmit(mockEvent)
          } catch (error) {
            expect(error.status).toBe(404)
            expect(error.message).toBe("Erreur 404")
          }
        })
      })
      describe ('When I send a POST request to the API and the server rejects the request', () => {
        test("Then it should display an Error 500 message", async () => {
          store.bills = jest.fn(() => ({
            update: jest.fn().mockRejectedValue(new Error("Erreur 500"))
          }))
          const onNavigate = jest.fn()
          const newBill = new NewBill({document, onNavigate, store, localStorage})
    
          const handleSubmit = jest.fn(newBill.handleSubmit)
          
          try {
            await handleSubmit(mockEvent)
          } catch (error) {
            expect(error.status).toBe(500)
            expect(error.message).toBe("Erreur 500")
          }
        })
      })
    })
  })
})
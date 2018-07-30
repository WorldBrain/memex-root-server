import { Request, Response } from 'express'

export interface SessionRequest extends Request {
  session : {[key : string] : any}
}

export interface ExpressReqRes {
  req : SessionRequest
  res : Response
  next : Function
}

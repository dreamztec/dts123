export type Coordinates = { latitude:number; longitude:number }
export type RouteEstimate = { distanceKm:number; durationMinutes:number; geometry?:unknown }
export interface MapsProvider { geocode(query:string):Promise<Coordinates[]>; route(origin:Coordinates,destination:Coordinates):Promise<RouteEstimate>; eta(origin:Coordinates,destination:Coordinates):Promise<number> }
export interface PaymentProvider { initialise(input:{email:string;amountKobo:number;reference:string;callbackUrl:string}):Promise<{authorisationUrl:string;reference:string}>; verify(reference:string):Promise<{verified:boolean;amountKobo:number;currency:string}>; verifyWebhook(rawBody:string,signature:string):boolean }
export interface MessagingProvider { send(input:{channel:'email'|'sms'|'whatsapp'|'push';recipient:string;templateKey:string;variables:Record<string,string>}):Promise<{messageId:string}> }
export interface FlightStatusProvider { getFlightStatus(flightNumber:string,date:string):Promise<{status:string;scheduledTime?:string;estimatedTime?:string}> }
export interface TelematicsProvider { getVehicleTelemetry(externalVehicleId:string):Promise<{recordedAt:string;location?:Coordinates;batteryPercent?:number;rangeKm?:number;charging?:boolean}> }

export class IntegrationNotConnectedError extends Error { constructor(provider:string) { super(`${provider} integration not connected`) } }

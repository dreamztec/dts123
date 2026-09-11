export type AudienceType = 'INDIVIDUAL' | 'DRIVER' | 'COMPANY'
export type QuestionnaireOption = { value:string; label:string }
export type Questionnaire = { questionKey:string; question:string; options:QuestionnaireOption[]; allowOther:boolean }

export const signupQuestionnaires: Record<AudienceType, Questionnaire> = {
  INDIVIDUAL: {
    questionKey: 'biggest_transportation_problem',
    question: 'What has been your biggest transportation problem?',
    options: [
      { value:'UNRELIABLE_DRIVERS', label:'Unreliable drivers' },
      { value:'HIGH_COSTS', label:'High transportation costs' },
      { value:'LONG_WAITING_TIMES', label:'Long waiting times' },
      { value:'SAFETY_CONCERNS', label:'Safety concerns' },
      { value:'POOR_SERVICE', label:'Poor service' },
      { value:'BUSY_PERIOD_AVAILABILITY', label:'Busy-period availability' },
      { value:'AIRPORT_TRANSPORTATION', label:'Airport transportation' },
      { value:'WORK_COMMUTE', label:'Work commute' },
      { value:'FAMILY_TRANSPORTATION', label:'Family transportation' },
      { value:'CORPORATE_TRANSPORTATION', label:'Corporate transportation' },
      { value:'INTERSTATE_TRAVEL', label:'Interstate travel' },
      { value:'PROFESSIONAL_CHAUFFEUR_ACCESS', label:'Professional chauffeur access' },
    ],
    allowOther: true,
  },
  DRIVER: {
    questionKey: 'biggest_transportation_work_problem',
    question: 'What has been your biggest transportation work problem?',
    options: [
      { value:'UNPREDICTABLE_INCOME', label:'Unpredictable income' },
      { value:'WAITING_FOR_PASSENGERS', label:'Waiting for passengers' },
      { value:'FUEL_COSTS', label:'Fuel costs' },
      { value:'FINDING_PASSENGERS', label:'Finding passengers' },
      { value:'DIFFICULT_PASSENGERS', label:'Difficult passengers' },
      { value:'LONG_WORKING_HOURS', label:'Long working hours' },
      { value:'VEHICLE_MAINTENANCE', label:'Vehicle maintenance' },
      { value:'UNFAIR_COMMISSIONS', label:'Unfair commissions' },
      { value:'SAFETY', label:'Safety' },
      { value:'PAYMENT_DELAYS', label:'Payment delays' },
      { value:'TRAFFIC', label:'Traffic' },
    ],
    allowOther: true,
  },
  COMPANY: {
    questionKey: 'biggest_transportation_management_problem',
    question: 'What has been your biggest transportation management problem?',
    options: [
      { value:'EMPLOYEE_TRANSPORTATION', label:'Employee transportation' },
      { value:'EXECUTIVE_TRANSPORTATION', label:'Executive transportation' },
      { value:'AIRPORT_TRANSPORTATION', label:'Airport transportation' },
      { value:'COST', label:'Cost' },
      { value:'RELIABILITY', label:'Reliability' },
      { value:'SAFETY', label:'Safety' },
      { value:'SCHEDULING', label:'Scheduling' },
      { value:'EXPENSE_CONTROL', label:'Expense control' },
      { value:'APPROVALS', label:'Approvals' },
      { value:'REPORTING', label:'Reporting' },
      { value:'RECURRING_TRANSPORTATION', label:'Recurring transportation' },
      { value:'EVENTS', label:'Events' },
      { value:'INTERSTATE_TRANSPORTATION', label:'Interstate transportation' },
    ],
    allowOther: true,
  },
}

const optionValues = new Map<string, Set<string>>(
  (Object.entries(signupQuestionnaires) as [AudienceType, Questionnaire][]).map(([audience,questionnaire]) => [audience, new Set(questionnaire.options.map((option) => option.value))]),
)

export function validateQuestionnaireResponse(audience:AudienceType, selectedOption:string|null, otherText:string|null) {
  const questionnaire = signupQuestionnaires[audience]
  const trimmedOther = otherText?.trim() || null
  const choice = selectedOption || (trimmedOther ? 'OTHER' : null)
  if (!choice && !trimmedOther) throw new Error('Select an option or describe your answer')
  if (choice !== 'OTHER' && choice && !questionnaire.options.some((option) => option.value === choice)) throw new Error('Invalid option for this questionnaire')
  if (choice === 'OTHER' && !trimmedOther) throw new Error('Describe your answer in the free-text field')
  return { questionKey:questionnaire.questionKey, selectedOption:choice, otherText:trimmedOther }
}

export function isKnownOption(audience:AudienceType, value:string) { return signupQuestionnaires[audience].options.some((option) => option.value === value) }
export function questionnaireOptionCount(audience:AudienceType) { return signupQuestionnaires[audience].options.length }
export const questionnaireAudienceHasOther = (audience:AudienceType) => signupQuestionnaires[audience].allowOther
export { optionValues }
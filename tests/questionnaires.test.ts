import assert from 'node:assert/strict'
import test from 'node:test'
import { validateQuestionnaireResponse, isKnownOption, questionnaireOptionCount, questionnaireAudienceHasOther, signupQuestionnaires } from '../src/lib/questionnaires.ts'

test('individual questionnaire matches the FASTRIDES signup question and option set', () => {
  const questionnaire = signupQuestionnaires.INDIVIDUAL
  assert.equal(questionnaire.question, 'What has been your biggest transportation problem?')
  assert.equal(questionnaireOptionCount('INDIVIDUAL'), 12)
  assert.ok(questionnaireAudienceHasOther('INDIVIDUAL'))
  assert.ok(isKnownOption('INDIVIDUAL','LONG_WAITING_TIMES'))
  assert.ok(!isKnownOption('INDIVIDUAL','SCHEDULING'))
})

test('driver and company questionnaires expose their own option sets', () => {
  assert.equal(signupQuestionnaires.DRIVER.question, 'What has been your biggest transportation work problem?')
  assert.ok(isKnownOption('DRIVER','UNPREDICTABLE_INCOME'))
  assert.equal(signupQuestionnaires.COMPANY.question, 'What has been your biggest transportation management problem?')
  assert.ok(isKnownOption('COMPANY','EMPLOYEE_TRANSPORTATION'))
})

test('questionnaire validation accepts a known option', () => {
  const validated = validateQuestionnaireResponse('INDIVIDUAL','HIGH_COSTS',null)
  assert.equal(validated.questionKey,'biggest_transportation_problem')
  assert.equal(validated.selectedOption,'HIGH_COSTS')
  assert.equal(validated.otherText,null)
})

test('questionnaire validation requires free text for the Other option', () => {
  assert.throws(() => validateQuestionnaireResponse('INDIVIDUAL','OTHER',null), /free-text/i)
  assert.throws(() => validateQuestionnaireResponse('INDIVIDUAL','OTHER','   '), /free-text/i)
  const validated = validateQuestionnaireResponse('DRIVER',null,'Fuel costs on long airport waits')
  assert.equal(validated.selectedOption,'OTHER')
  assert.equal(validated.otherText,'Fuel costs on long airport waits')
})

test('questionnaire validation rejects unknown options and empty answers', () => {
  assert.doesNotThrow(() => validateQuestionnaireResponse('COMPANY','EMPLOYEE_TRANSPORTATION',null))
  assert.throws(() => validateQuestionnaireResponse('INDIVIDUAL',null,null), /Select an option or describe/i)
  assert.throws(() => validateQuestionnaireResponse('INDIVIDUAL','NOT_AN_OPTION',null), /Invalid option/i)
})
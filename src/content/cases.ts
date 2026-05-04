import type { PatientCase } from '../types'

export const CASES: Record<string, PatientCase> = {
  case_level1_cms: {
    id: 'case_level1_cms',
    patientName: 'Maria Santos',
    age: 42,
    insurance: 'Blue Cross PPO',
    diagnosis: 'Type 2 diabetes mellitus without complications',
    diagnosisCode: 'E11.9',
    procedure: 'Office visit, established patient, moderate complexity',
    procedureCode: '99214',
    formType: 'cms1500',
    level: 1,
    errors: [
      {
        field: 'Subscriber ID',
        currentValue: 'XGP882401',
        correctValue: 'XGP882410',
        explanation: 'Transposed last two digits. The 270 eligibility response had the correct ID — always verify against the electronic response, not the card photocopy.',
      },
      {
        field: 'Place of Service',
        currentValue: '23',
        correctValue: '11',
        explanation: 'POS 23 is Emergency Room. This was an office visit — POS 11. Wrong POS can trigger a denial or change reimbursement.',
      },
    ],
  },
  case_level1_ub: {
    id: 'case_level1_ub',
    patientName: 'Robert Chen',
    age: 67,
    insurance: 'Medicare Part A',
    diagnosis: 'Acute appendicitis with peritonitis',
    diagnosisCode: 'K35.20',
    procedure: 'Laparoscopic appendectomy',
    procedureCode: '0DTJ4ZZ',
    revenueCode: '0360',
    formType: 'ub04',
    level: 1,
    errors: [
      {
        field: 'Type of Bill',
        currentValue: '131',
        correctValue: '111',
        explanation: 'TOB 131 is outpatient. An appendectomy with admission is inpatient — TOB 111. This determines which payment system (IPPS vs OPPS) processes the claim.',
      },
      {
        field: 'Revenue Code',
        currentValue: '0250',
        correctValue: '0360',
        explanation: 'Rev code 0250 is Pharmacy. The OR charge should be 0360 (Operating Room). Revenue codes tell the payer what department provided the service.',
      },
    ],
  },
}

export const CASE_LIST = Object.values(CASES)

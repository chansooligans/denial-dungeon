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

  // -------------------------------------------------------------------------
  // Cases for archetype obstacles in the Waiting Room. Each ships realistic
  // CMS-1500 data (ICD-10, CPT, POS, charges) that a battle can reference.
  // -------------------------------------------------------------------------

  // Linked to encounter `co_50` (Medical Necessity Wraith).
  case_wraith_walker: {
    id: 'case_wraith_walker',
    patientName: 'Arlene Walker',
    age: 67,
    insurance: 'BCBS NC PPO',
    diagnosis: 'Heart failure, unspecified',
    diagnosisCode: 'I50.9',
    procedure: 'Echocardiography, transthoracic, complete with Doppler',
    procedureCode: '93306',
    formType: 'cms1500',
    level: 4,
    claim: {
      type: 'cms1500',
      claimId: 'CLM-2026-01-15-04401',
      insuranceType: 'Group',
      patient: { name: 'WALKER, ARLENE', dob: '1958-03-12', sex: 'F' },
      insured: { id: 'BCB827193401', name: 'WALKER, ARLENE', group: '0042873' },
      diagnoses: [
        { code: 'I50.9', label: 'Heart failure, unspecified' },
      ],
      serviceLines: [
        {
          dos: '2026-01-15',
          pos: '11',
          cpt: { code: '93306', label: 'TTE w/ Doppler, complete' },
          dxPointer: 'A',
          charges: '$2,150.00',
        },
      ],
      provider: { name: 'Dr. M. Chen, MD', npi: '1487329104' },
    },
  },

  // Linked to encounter `co_29_reaper` (Timely Filing Reaper).
  case_reaper_park: {
    id: 'case_reaper_park',
    patientName: 'Devon Park',
    age: 33,
    insurance: 'Aetna PPO',
    diagnosis: 'Unilateral primary osteoarthritis, right knee',
    diagnosisCode: 'M17.11',
    procedure: 'Arthroplasty, knee, condyle and plateau (total knee replacement)',
    procedureCode: '27447',
    formType: 'cms1500',
    level: 7,
    claim: {
      type: 'cms1500',
      claimId: 'CLM-2025-08-15-22087',
      insuranceType: 'Group',
      patient: { name: 'PARK, DEVON', dob: '1992-07-22', sex: 'M' },
      insured: { id: 'AET882441923', name: 'PARK, DEVON', group: '0078421' },
      diagnoses: [
        { code: 'M17.11', label: 'OA right knee, primary' },
      ],
      serviceLines: [
        {
          dos: '2025-08-15',
          pos: '22',
          cpt: { code: '27447', label: 'Total knee arthroplasty' },
          dxPointer: 'A',
          charges: '$42,300.00',
        },
      ],
      provider: { name: 'Dr. R. Adeyemi, MD', npi: '1659827733' },
    },
  },

  // Linked to encounter `co_97` (The Bundle / Bundling Beast).
  case_bundle_kim: {
    id: 'case_bundle_kim',
    patientName: 'Sarah Kim',
    age: 52,
    insurance: 'Cigna OAP',
    diagnosis: 'Actinic keratosis (with hypertension)',
    diagnosisCode: 'L57.0',
    procedure: 'Office E&M + tangential skin biopsy (same day)',
    procedureCode: '99214 + 11102',
    formType: 'cms1500',
    level: 5,
    claim: {
      type: 'cms1500',
      claimId: 'CLM-2026-04-12-09931',
      insuranceType: 'Group',
      patient: { name: 'KIM, SARAH', dob: '1973-11-04', sex: 'F' },
      insured: { id: 'CIG9938221', name: 'KIM, SARAH', group: '0093388' },
      diagnoses: [
        { code: 'L57.0', label: 'Actinic keratosis' },
        { code: 'I10',   label: 'Essential hypertension' },
      ],
      serviceLines: [
        {
          dos: '2026-04-12',
          pos: '11',
          cpt: { code: '99214', label: 'Office E&M, established, mod' },
          dxPointer: 'B',
          charges: '$215.00',
        },
        {
          dos: '2026-04-12',
          pos: '11',
          cpt: { code: '11102', label: 'Tangential skin biopsy' },
          dxPointer: 'A',
          charges: '$185.00',
        },
      ],
      provider: { name: 'Dr. J. Patel, MD', npi: '1234560987' },
    },
  },
}

export const CASE_LIST = Object.values(CASES)

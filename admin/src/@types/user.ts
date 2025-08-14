export const UserTypeEnum = {
  EXTERNAL_USER: 'EXTERNAL_USER',
  INTERNAL_EMPLOYEE: 'INTERNAL_EMPLOYEE'
} as const;

export type UserType = (typeof UserTypeEnum)[keyof typeof UserTypeEnum];

export const ProductSeriesEnum = {
  SEALOS: 'SEALOS',
  FASTGPT: 'FASTGPT',
  LAF_SEALAF: 'LAF_SEALAF',
  AI_PROXY: 'AI_PROXY'
} as const;

export type ProductSeries = (typeof ProductSeriesEnum)[keyof typeof ProductSeriesEnum];

export const RechargeCodeTypeEnum = {
  TEST_RECHARGE: 'TEST_RECHARGE',
  COMPENSATION_RECHARGE: 'COMPENSATION_RECHARGE',
  ACTIVITY_RECHARGE: 'ACTIVITY_RECHARGE',
  CORPORATE_RECHARGE: 'CORPORATE_RECHARGE'
} as const;

export type RechargeCodeType = (typeof RechargeCodeTypeEnum)[keyof typeof RechargeCodeTypeEnum];

export const RechargeCodeTypeLabels = {
  TEST_RECHARGE: '测试充值',
  COMPENSATION_RECHARGE: '补偿充值',
  ACTIVITY_RECHARGE: '活动充值',
  CORPORATE_RECHARGE: '对公充值'
} as const;

export const UserTypeLabels = {
  EXTERNAL_USER: '外部用户',
  INTERNAL_EMPLOYEE: '内部员工'
} as const;

export const ProductSeriesLabels = {
  SEALOS: 'Sealos',
  FASTGPT: 'FastGPT',
  LAF_SEALAF: 'Laf/Sealaf',
  AI_PROXY: 'AI Proxy'
} as const;

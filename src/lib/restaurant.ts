// معلومات المطعم - تستخدم في كل أنحاء التطبيق والطباعة
export const RESTAURANT_INFO = {
  name: 'مطعم التكية',
  subtitle: 'أبو أمنة الشعبي',
  address: 'السودان - الخرطوم - الكلاكلة اللفة',
  phones: ['0100012345', '0129826066'],
  currency: 'ج.س',
  currencyCode: 'SSP',
  taxNumber: '',
  version: '2.0',
} as const

// رؤوس الطباعة الحرارية
export const PRINT_HEADER_TEXT = `${RESTAURANT_INFO.name} - ${RESTAURANT_INFO.subtitle}`
export const PRINT_ADDRESS_TEXT = RESTAURANT_INFO.address
export const PRINT_PHONES_TEXT = `ت: ${RESTAURANT_INFO.phones.join(' - ')}`

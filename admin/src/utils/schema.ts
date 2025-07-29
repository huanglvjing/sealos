import { zfd } from 'zod-form-data';
export const uploadInvoiceSchema = zfd.formData({
  id: zfd.text(),
  file: zfd.file(),
});
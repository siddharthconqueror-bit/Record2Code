// Helper: Check if report describes neoplasm / malignancy
function hasNeoplasmContext(text) {
  return /\b(?:neoplasm|neoplasms|neoplastic|tumor|tumour|tumors|tumours|cancer|cancers|carcinoma|carcinomas|sarcoma|sarcomas|malignant|malignancy|malignancies|benign|adenoma|adenomas|melanoma|leukemia|leukaemia|lymphoma|lymphomas|metastasis|metastases|metastatic|myeloma|mass|oncology)\b/i.test(text);
}

export interface TaxCalculation {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  gstRate: number;
  isIntrastate: boolean;
}

/**
 * Check if transaction is intrastate (same state) based on GST numbers
 * @param clientGST Client's GST number
 * @param companyGST Company's GST number (default: Maharashtra - 27)
 * @returns true if same state, false otherwise
 */
export function isIntrastate(
  clientGST: string,
  companyGST: string = "27"
): boolean {
  if (!clientGST || clientGST.length < 2) return false;

  const clientStateCode = clientGST.substring(0, 2);
  const companyStateCode = companyGST.substring(0, 2);

  return clientStateCode === companyStateCode;
}

/**
 * Get GST rate based on HSN code
 * @param hsnCode HSN code of the product
 * @returns GST rate as percentage
 */
export function getGSTRateByHSN(hsnCode: string): number {
  // Default rates by HSN code prefix
  // This is a simplified version - in production, use a complete HSN database

  if (!hsnCode) return 18; // Default rate

  const hsnPrefix = hsnCode.substring(0, 4);

  // Common cosmetics and pharmaceutical HSN codes
  const hsnRates: Record<string, number> = {
    "3003": 12, // Medicaments
    "3004": 12, // Medicaments in measured doses
    "3301": 18, // Essential oils
    "3303": 18, // Perfumes and toilet waters
    "3304": 18, // Beauty or make-up preparations
    "3305": 18, // Hair preparations
    "3306": 18, // Oral/dental hygiene preparations
    "3307": 18, // Pre-shave, shaving preparations
  };

  return hsnRates[hsnPrefix] || 18; // Default 18% if not found
}

/**
 * Calculate GST breakdown for an invoice
 * @param subtotal Subtotal amount before tax
 * @param clientGSTNumber Client's GST number
 * @param companyGSTNumber Company's GST number (optional)
 * @param hsnCode HSN code for tax rate determination (optional)
 * @returns Complete tax calculation breakdown
 */
export function calculateGST(
  subtotal: number,
  clientGSTNumber: string = "",
  companyGSTNumber: string = "27", // Default: Maharashtra
  hsnCode: string = ""
): TaxCalculation {
  const gstRate = getGSTRateByHSN(hsnCode);
  const isIntrastateTransaction = isIntrastate(
    clientGSTNumber,
    companyGSTNumber
  );

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isIntrastateTransaction) {
    // Intrastate: Split GST into CGST and SGST
    cgst = (subtotal * gstRate) / 200; // Half of GST rate
    sgst = (subtotal * gstRate) / 200; // Half of GST rate
  } else {
    // Interstate: Only IGST
    igst = (subtotal * gstRate) / 100;
  }

  const totalTax = cgst + sgst + igst;
  const totalAmount = subtotal + totalTax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    gstRate,
    isIntrastate: isIntrastateTransaction,
  };
}

/**
 * Convert number to words (Indian numbering system)
 * @param amount Amount to convert
 * @returns Amount in words
 */
export function convertToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";

    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
      );

    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
    );
  }

  function convertIndianNumber(n: number): string {
    if (n === 0) return "";

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    let result = "";

    if (crore > 0) {
      result += convertLessThanThousand(crore) + " Crore ";
    }
    if (lakh > 0) {
      result += convertLessThanThousand(lakh) + " Lakh ";
    }
    if (thousand > 0) {
      result += convertLessThanThousand(thousand) + " Thousand ";
    }
    if (remainder > 0) {
      result += convertLessThanThousand(remainder);
    }

    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = convertIndianNumber(rupees) + " Rupees";

  if (paise > 0) {
    words += " and " + convertLessThanThousand(paise) + " Paise";
  }

  return words + " Only";
}

/**
 * Format currency in Indian style
 * @param amount Amount to format
 * @returns Formatted string with Indian comma separator
 */
export function formatIndianCurrency(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0.00";
  }
  const [integer, decimal] = amount.toFixed(2).split(".");
  const lastThree = integer.substring(integer.length - 3);
  const otherNumbers = integer.substring(0, integer.length - 3);

  const formatted =
    otherNumbers !== ""
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;

  return "₹" + formatted + "." + decimal;
}

/**
 * Validate GST number format
 * @param gstNumber GST number to validate
 * @returns true if valid format
 */
export function validateGSTNumber(gstNumber: string): boolean {
  if (!gstNumber) return false;
  const gstPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstPattern.test(gstNumber);
}

/**
 * Extract state code from GST number
 * @param gstNumber GST number
 * @returns State code (first 2 digits)
 */
export function getStateCodeFromGST(gstNumber: string): string {
  if (!gstNumber || gstNumber.length < 2) return "";
  return gstNumber.substring(0, 2);
}

/**
 * Get state name from state code
 * @param stateCode 2-digit state code
 * @returns State name
 */
export function getStateName(stateCode: string): string {
  const states: Record<string, string> = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman and Diu",
    "26": "Dadra and Nagar Haveli",
    "27": "Maharashtra",
    "28": "Andhra Pradesh",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh (New)",
  };

  return states[stateCode] || "Unknown";
}

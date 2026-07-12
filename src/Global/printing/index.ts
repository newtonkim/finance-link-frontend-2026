// types and interfaces
export interface PrintOptions {
  size: keyof typeof paperSizes | string // named size or custom like '80mm 200mm'
  orientation?: 'portrait' | 'landscape'
}

interface SizeDimensions {
  width: number
  height: number
}

// Predefined paper sizes
export const paperSizes: Record<string, string> = {
  // ISO A series (mm)
  A0: '841mm 1189mm',
  A1: '594mm 841mm',
  A2: '420mm 594mm',
  A3: '297mm 420mm',
  A4: '210mm 297mm',
  A5: '148mm 210mm',
  A6: '105mm 148mm',
  A7: '74mm 105mm',
  A8: '52mm 74mm',
  A9: '37mm 52mm',
  A10: '26mm 37mm',
  // US sizes
  Letter: '8.5in 11in',
  Legal: '8.5in 14in',
  Tabloid: '11in 17in',
  // Receipt sizes
  '50': '50mm auto',
  '58': '58mm auto',
  '80': '80mm auto',
  '100': '100mm auto',
}

// Size selector list (optional)
export const sizPapers = [
  { label: 'Receipts', value: null,type:"Receipts" },
  { label: '50', value: '50mm',type:"Receipts" },
  { label: '58', value: '58mm',type:"Receipts" },
  { label: '80', value: '80mm',type:"Receipts" },
  { label: '100', value: '100mm',type:"Receipts" },
  { label: 'Pages', value: null,type:"Pages" },
  { label: 'A0', value: 'A0',type:"Pages" },
  { label: 'A1', value: 'A1',type:"Pages" },
  { label: 'A2', value: 'A2',type:"Pages" },
  { label: 'A3', value: 'A3',type:"Pages" },
  { label: 'A4', value: 'A4',type:"Pages" },
  { label: 'A5', value: 'A5',type:"Pages" },
  { label: 'A6', value: 'A6',type:"Pages" },
  { label: 'A7', value: 'A7',type:"Pages" },
  { label: 'A8', value: 'A8',type:"Pages" },
  { label: 'A9', value: 'A9',type:"Pages" },
  { label: 'A10', value: 'A10',type:"Pages" },
  { label: 'US', value: null ,type:"Us"},
  { label: 'Letter', value: 'Letter',type:"Us" },
  { label: 'Legal', value: 'Legal',type:"Us" },
  { label: 'Tabloid', value: 'Tabloid',type:"Us" },
]
export function sizePapers(show = ['Pages', 'US']) {
  return sizPapers.filter((val) => show.includes(val.type));
}
/**
 * Parse width and height from string like "210mm 297mm" or "80mm auto"
 */
function parseSize(size?: string): SizeDimensions {
  if (!size) return { width: 100, height: 200 } // fallback dimensions

  const parts = `${size}`.split(' ')
  let width = 0,
    height = 0

  if (parts[0]?.endsWith('mm')) width = parseFloat(parts[0])
  else if (parts[0]?.endsWith('in')) width = parseFloat(parts[0]) * 25.4
  else width = 100 // fallback width

  if (parts[1]?.endsWith('mm')) height = parseFloat(parts[1])
  else if (parts[1]?.endsWith('in')) height = parseFloat(parts[1]) * 25.4
  else if (parts[1] === 'auto')
    height = width * 2 // simple fallback
  else height = width * 2 // fallback height

  return { width, height }
}

/**
 * Determine orientation automatically based on paper dimensions
 */
function getOrientation(size: string): 'portrait' | 'landscape' {
  const paper = paperSizes[size] || size
  const { width, height } = parseSize(paper)

  return width > height ? 'landscape' : 'portrait'
}

/**
 * Set dynamic print style for any paper size
 */
export function setPrintSize(options: PrintOptions, orientation?: 'portrait' | 'landscape') {
  const { size } = options
  const pageSize = paperSizes[size] || size

  const existingStyle = document.getElementById('dynamicPrintStyle')
  if (existingStyle) existingStyle.remove()

  const style = document.createElement('style')
  style.id = 'dynamicPrintStyle'
  style.innerHTML = `
    @page {
      size: ${pageSize} ${orientation ?? getOrientation(size)};
      margin: 0;
    }
    @media print {
      body {
        margin: 0;
      }
    }
  `
  document.head.appendChild(style)
}

/**
 * Print HTML content directly on current page without opening new window
 */

// export function printElement(htmldata: string, options: PrintOptions) {
  

//   const printWindow = window.open('', '', 'height=600,width=400')
//   if (!printWindow) return 
//   printWindow.document.open()
//   printWindow.document.write(`
// <html><head><title>Print</title></head><body>
// ${htmldata}
//     </body></html>
    
//     `)
//   // printWindow.document.close()

//   printWindow.onload = () => {
//     const style = printWindow.document.createElement('style')
//     const pageSize = paperSizes[options.size] || options.size
//     const orientation = getOrientation(options.size)

//     style.innerHTML = `
//       @page {
//         size: ${pageSize} ${orientation};
//         margin: 5mm;
//       }
//       body {
//         margin: 0;
//         font-family: "Inter Variable", Inter, Arial, sans-serif;
//       }
//     `
     
//      printWindow.document.close()
//       printWindow.focus()

//   setTimeout(() => {
//     printWindow.print()
//     printWindow.close()
//   }, 300)
//   }
// }

 export function printElement(htmldata: string, options: PrintOptions) {
  const printWindow = window.open('', '', 'height=900,width=900')
  if (!printWindow) return

  const pageSize = options.size && paperSizes[options.size] || options.size
  const orientation = options.size?getOrientation(options.size):null

  printWindow.document.open()
  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          @page {
            size: ${pageSize} ${orientation};
            margin: 5mm;
          }
          body {
            margin: 0;
            font-family: "Inter Variable", Inter, Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${htmldata}
      </body>
    </html>
  `)
  printWindow.document.close()  

  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)
}
